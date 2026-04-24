import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  membersTable,
  storiesTable,
  tasksTable,
  projectsTable,
} from "@workspace/db";
import {
  CreateTaskBody,
  CreateTaskParams,
  GetTaskParams,
  UpdateTaskBody,
  UpdateTaskParams,
  DeleteTaskParams,
  ListTasksParams,
} from "@workspace/api-zod";
import { enqueueNotification } from "../lib/notifications";
import { recordActivity } from "../lib/activity";

const router: IRouter = Router();

async function loadTaskWithAssignee(taskId: number) {
  const [row] = await db
    .select({ task: tasksTable, assignee: membersTable })
    .from(tasksTable)
    .leftJoin(membersTable, eq(tasksTable.assigneeId, membersTable.id))
    .where(eq(tasksTable.id, taskId));
  if (!row) return null;
  return { ...row.task, assignee: row.assignee };
}

router.get("/stories/:storyId/tasks", async (req, res): Promise<void> => {
  const params = ListTasksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select({ task: tasksTable, assignee: membersTable })
    .from(tasksTable)
    .leftJoin(membersTable, eq(tasksTable.assigneeId, membersTable.id))
    .where(eq(tasksTable.storyId, params.data.storyId))
    .orderBy(tasksTable.createdAt);
  res.json(rows.map((r) => ({ ...r.task, assignee: r.assignee })));
});

router.post("/stories/:storyId/tasks", async (req, res): Promise<void> => {
  const params = CreateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [story] = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.id, params.data.storyId));
  if (!story) {
    res.status(404).json({ error: "Story not found" });
    return;
  }
  const [row] = await db
    .insert(tasksTable)
    .values({
      storyId: params.data.storyId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      assigneeId: parsed.data.assigneeId ?? null,
      estimateHours: parsed.data.estimateHours ?? null,
      dueDate: parsed.data.dueDate ?? null,
      status: parsed.data.status ?? "todo",
    })
    .returning();

  await recordActivity({
    kind: "task.created",
    message: `Task "${row!.title}" was created`,
    projectId: story.projectId,
    storyId: story.id,
    taskId: row!.id,
  });

  // Async: notify the assignee if one was set on creation
  if (row!.assigneeId) {
    const [assignee] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, row!.assigneeId));
    if (assignee) {
      const [project] = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, story.projectId));
      await enqueueNotification({
        kind: "task.assigned",
        recipientEmail: assignee.email,
        recipientName: assignee.name,
        relatedTaskId: row!.id,
        subject: `[${project?.key ?? "Sprint"}] You were assigned: ${row!.title}`,
        body:
          `Hi ${assignee.name},\n\n` +
          `You have been assigned a new task in "${project?.name ?? "a project"}":\n\n` +
          `  ${row!.title}\n` +
          (row!.description ? `\n${row!.description}\n` : "") +
          `\nStory: ${story.title}\nStatus: ${row!.status}` +
          (row!.dueDate ? `\nDue: ${row!.dueDate.toISOString()}` : "") +
          `\n\n— Sprint`,
      });
    }
  }

  const full = await loadTaskWithAssignee(row!.id);
  res.status(201).json(full);
});

router.get("/tasks/:taskId", async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const full = await loadTaskWithAssignee(params.data.taskId);
  if (!full) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(full);
});

router.patch("/tasks/:taskId", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const before = await loadTaskWithAssignee(params.data.taskId);
  if (!before) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const [updated] = await db
    .update(tasksTable)
    .set({
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.assigneeId !== undefined && {
        assigneeId: parsed.data.assigneeId,
      }),
      ...(parsed.data.estimateHours !== undefined && {
        estimateHours: parsed.data.estimateHours,
      }),
      ...(parsed.data.dueDate !== undefined && {
        dueDate: parsed.data.dueDate,
      }),
    })
    .where(eq(tasksTable.id, params.data.taskId))
    .returning();

  const after = await loadTaskWithAssignee(updated!.id);
  const [story] = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.id, updated!.storyId));
  const [project] = story
    ? await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, story.projectId))
    : [];

  // Async: notify on assignment change
  const newAssigneeId = updated!.assigneeId;
  if (newAssigneeId && newAssigneeId !== before.assigneeId) {
    const [assignee] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, newAssigneeId));
    if (assignee) {
      await enqueueNotification({
        kind: "task.assigned",
        recipientEmail: assignee.email,
        recipientName: assignee.name,
        relatedTaskId: updated!.id,
        subject: `[${project?.key ?? "Sprint"}] You were assigned: ${updated!.title}`,
        body:
          `Hi ${assignee.name},\n\n` +
          `You have been assigned a task in "${project?.name ?? "a project"}":\n\n` +
          `  ${updated!.title}\n` +
          (updated!.description ? `\n${updated!.description}\n` : "") +
          `\nStory: ${story?.title ?? ""}\nStatus: ${updated!.status}` +
          (updated!.dueDate ? `\nDue: ${updated!.dueDate.toISOString()}` : "") +
          `\n\n— Sprint`,
      });
    }
  }

  // Async: notify the assignee on status change (if assignee exists)
  if (
    parsed.data.status &&
    parsed.data.status !== before.status &&
    updated!.assigneeId
  ) {
    const [assignee] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, updated!.assigneeId));
    if (assignee) {
      await enqueueNotification({
        kind: "task.status_changed",
        recipientEmail: assignee.email,
        recipientName: assignee.name,
        relatedTaskId: updated!.id,
        subject: `[${project?.key ?? "Sprint"}] Task status: ${updated!.title} → ${updated!.status}`,
        body:
          `Hi ${assignee.name},\n\n` +
          `The task "${updated!.title}" in "${project?.name ?? "a project"}" ` +
          `has moved from ${before.status} to ${updated!.status}.\n\n— Sprint`,
      });
    }
  }

  // Activity event
  if (parsed.data.status && parsed.data.status !== before.status) {
    await recordActivity({
      kind: "task.status_changed",
      message: `Task "${updated!.title}" moved to ${updated!.status}`,
      projectId: story?.projectId ?? null,
      storyId: updated!.storyId,
      taskId: updated!.id,
    });
  } else if (
    parsed.data.assigneeId !== undefined &&
    parsed.data.assigneeId !== before.assigneeId
  ) {
    await recordActivity({
      kind: "task.assigned",
      message: `Task "${updated!.title}" was reassigned`,
      projectId: story?.projectId ?? null,
      storyId: updated!.storyId,
      taskId: updated!.id,
    });
  } else {
    await recordActivity({
      kind: "task.updated",
      message: `Task "${updated!.title}" was updated`,
      projectId: story?.projectId ?? null,
      storyId: updated!.storyId,
      taskId: updated!.id,
    });
  }

  res.json(after);
});

router.delete("/tasks/:taskId", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, params.data.taskId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  await recordActivity({
    kind: "task.deleted",
    message: `Task "${row.title}" was deleted`,
    storyId: row.storyId,
    taskId: row.id,
  });
  res.sendStatus(204);
});

export default router;
