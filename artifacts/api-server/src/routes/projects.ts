import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import {
  db,
  membersTable,
  projectsTable,
  storiesTable,
  tasksTable,
} from "@workspace/db";
import {
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectBody,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";
import { recordActivity } from "../lib/activity";

const router: IRouter = Router();

async function loadProjectSummaries(projectId?: number) {
  const where = projectId ? eq(projectsTable.id, projectId) : undefined;
  const rows = await db
    .select({
      project: projectsTable,
      owner: membersTable,
      storyCount: sql<number>`COALESCE(COUNT(DISTINCT ${storiesTable.id}), 0)`.as(
        "story_count",
      ),
      taskCount: sql<number>`COALESCE(COUNT(${tasksTable.id}), 0)`.as(
        "task_count",
      ),
      tasksDone: sql<number>`COALESCE(SUM(CASE WHEN ${tasksTable.status} = 'done' THEN 1 ELSE 0 END), 0)`.as(
        "tasks_done",
      ),
      tasksInProgress: sql<number>`COALESCE(SUM(CASE WHEN ${tasksTable.status} = 'in_progress' THEN 1 ELSE 0 END), 0)`.as(
        "tasks_in_progress",
      ),
      tasksTodo: sql<number>`COALESCE(SUM(CASE WHEN ${tasksTable.status} IN ('todo','blocked') THEN 1 ELSE 0 END), 0)`.as(
        "tasks_todo",
      ),
    })
    .from(projectsTable)
    .leftJoin(membersTable, eq(projectsTable.ownerId, membersTable.id))
    .leftJoin(storiesTable, eq(storiesTable.projectId, projectsTable.id))
    .leftJoin(tasksTable, eq(tasksTable.storyId, storiesTable.id))
    .where(where)
    .groupBy(projectsTable.id, membersTable.id)
    .orderBy(projectsTable.createdAt);

  return rows.map((r) => ({
    ...r.project,
    owner: r.owner,
    storyCount: Number(r.storyCount),
    taskCount: Number(r.taskCount),
    tasksDone: Number(r.tasksDone),
    tasksInProgress: Number(r.tasksInProgress),
    tasksTodo: Number(r.tasksTodo),
  }));
}

router.get("/projects", async (_req, res): Promise<void> => {
  const summaries = await loadProjectSummaries();
  res.json(summaries);
});

async function normalizeCreateProjectBody(body: unknown) {
  if (typeof body !== "object" || body === null) {
    return body;
  }

  const normalized = { ...body } as Record<string, unknown>;

  if (typeof normalized.ownerId === "string") {
    if (normalized.ownerId.trim() === "") {
      normalized.ownerId = null;
    } else {
      const parsedOwnerId = Number(normalized.ownerId);
      normalized.ownerId = Number.isInteger(parsedOwnerId)
        ? parsedOwnerId
        : normalized.ownerId;
    }
  }

  return normalized;
}

router.post("/projects", async (req, res): Promise<void> => {
  const normalizedBody = await normalizeCreateProjectBody(req.body);
  const parsed = CreateProjectBody.safeParse(normalizedBody);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.errors, body: normalizedBody }, "Project validation failed");
    res.status(400).json({ 
      error: "Validation failed",
      details: parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    });
    return;
  }
  try {
    const [row] = await db
      .insert(projectsTable)
      .values({
        key: parsed.data.key.toUpperCase(),
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        ownerId: parsed.data.ownerId ?? null,
      })
      .returning();
    await recordActivity({
      kind: "project.created",
      message: `Project "${row!.name}" was created`,
      projectId: row!.id,
    });
    res.status(201).json(row);
  } catch (err) {
    req.log.warn({ err }, "Failed to create project");
    res.status(400).json({ error: "Could not create project (key must be unique)" });
  }
});

router.get("/projects/:projectId", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const summaries = await loadProjectSummaries(params.data.projectId);
  const summary = summaries[0];
  if (!summary) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  // Stories with their tasks
  const stories = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.projectId, params.data.projectId))
    .orderBy(storiesTable.createdAt);

  const storyIds = stories.map((s) => s.id);
  const allTasks = storyIds.length
    ? await db
        .select({
          task: tasksTable,
          assignee: membersTable,
        })
        .from(tasksTable)
        .leftJoin(membersTable, eq(tasksTable.assigneeId, membersTable.id))
        .where(
          sql`${tasksTable.storyId} IN (${sql.join(storyIds.map((id) => sql`${id}`), sql`, `)})`,
        )
        .orderBy(tasksTable.createdAt)
    : [];

  const tasksByStory = new Map<number, Array<unknown>>();
  for (const t of allTasks) {
    const arr = tasksByStory.get(t.task.storyId) ?? [];
    arr.push({ ...t.task, assignee: t.assignee });
    tasksByStory.set(t.task.storyId, arr);
  }

  const storyDetails = stories.map((s) => ({
    ...s,
    tasks: tasksByStory.get(s.id) ?? [],
  }));

  res.json({ ...summary, stories: storyDetails });
});

router.patch("/projects/:projectId", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(projectsTable)
    .set({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.ownerId !== undefined && {
        ownerId: parsed.data.ownerId,
      }),
    })
    .where(eq(projectsTable.id, params.data.projectId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  await recordActivity({
    kind: "project.updated",
    message: `Project "${row.name}" was updated`,
    projectId: row.id,
  });
  res.json(row);
});

router.delete("/projects/:projectId", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.projectId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  await recordActivity({
    kind: "project.deleted",
    message: `Project "${row.name}" was deleted`,
  });
  res.sendStatus(204);
});

// Re-export helper for tests/seed if needed
export { loadProjectSummaries };
export default router;
