import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import {
  db,
  membersTable,
  storiesTable,
  tasksTable,
} from "@workspace/db";
import {
  CreateStoryBody,
  CreateStoryParams,
  GetStoryParams,
  UpdateStoryBody,
  UpdateStoryParams,
  DeleteStoryParams,
  ListStoriesParams,
} from "@workspace/api-zod";
import { recordActivity } from "../lib/activity";

const router: IRouter = Router();

router.get(
  "/projects/:projectId/stories",
  async (req, res): Promise<void> => {
    const params = ListStoriesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const rows = await db
      .select({
        story: storiesTable,
        taskCount: sql<number>`COALESCE(COUNT(${tasksTable.id}), 0)`.as(
          "task_count",
        ),
        tasksDone: sql<number>`COALESCE(SUM(CASE WHEN ${tasksTable.status} = 'done' THEN 1 ELSE 0 END), 0)`.as(
          "tasks_done",
        ),
      })
      .from(storiesTable)
      .leftJoin(tasksTable, eq(tasksTable.storyId, storiesTable.id))
      .where(eq(storiesTable.projectId, params.data.projectId))
      .groupBy(storiesTable.id)
      .orderBy(storiesTable.createdAt);

    res.json(
      rows.map((r) => ({
        ...r.story,
        taskCount: Number(r.taskCount),
        tasksDone: Number(r.tasksDone),
      })),
    );
  },
);

router.post(
  "/projects/:projectId/stories",
  async (req, res): Promise<void> => {
    const params = CreateStoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateStoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(storiesTable)
      .values({
        projectId: params.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        acceptanceCriteria: parsed.data.acceptanceCriteria ?? null,
        priority: parsed.data.priority ?? "medium",
        storyPoints: parsed.data.storyPoints ?? null,
      })
      .returning();
    await recordActivity({
      kind: "story.created",
      message: `Story "${row!.title}" was added`,
      projectId: params.data.projectId,
      storyId: row!.id,
    });
    res.status(201).json(row);
  },
);

router.get("/stories/:storyId", async (req, res): Promise<void> => {
  const params = GetStoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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
  const tasks = await db
    .select({ task: tasksTable, assignee: membersTable })
    .from(tasksTable)
    .leftJoin(membersTable, eq(tasksTable.assigneeId, membersTable.id))
    .where(eq(tasksTable.storyId, params.data.storyId))
    .orderBy(tasksTable.createdAt);
  res.json({
    ...story,
    tasks: tasks.map((t) => ({ ...t.task, assignee: t.assignee })),
  });
});

router.patch("/stories/:storyId", async (req, res): Promise<void> => {
  const params = UpdateStoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.id, params.data.storyId));
  if (!existing) {
    res.status(404).json({ error: "Story not found" });
    return;
  }
  const [row] = await db
    .update(storiesTable)
    .set({
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.acceptanceCriteria !== undefined && {
        acceptanceCriteria: parsed.data.acceptanceCriteria,
      }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.priority !== undefined && {
        priority: parsed.data.priority,
      }),
      ...(parsed.data.storyPoints !== undefined && {
        storyPoints: parsed.data.storyPoints,
      }),
    })
    .where(eq(storiesTable.id, params.data.storyId))
    .returning();
  await recordActivity({
    kind:
      parsed.data.status && parsed.data.status !== existing.status
        ? "story.status_changed"
        : "story.updated",
    message:
      parsed.data.status && parsed.data.status !== existing.status
        ? `Story "${row!.title}" moved to ${parsed.data.status}`
        : `Story "${row!.title}" was updated`,
    projectId: row!.projectId,
    storyId: row!.id,
  });
  res.json(row);
});

router.delete("/stories/:storyId", async (req, res): Promise<void> => {
  const params = DeleteStoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(storiesTable)
    .where(eq(storiesTable.id, params.data.storyId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Story not found" });
    return;
  }
  await recordActivity({
    kind: "story.deleted",
    message: `Story "${row.title}" was deleted`,
    projectId: row.projectId,
  });
  res.sendStatus(204);
});

export default router;
