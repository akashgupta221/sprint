import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, epicsTable, storiesTable } from "@workspace/db";
import {
  CreateEpicBody,
  CreateEpicParams,
  GetEpicParams,
  UpdateEpicBody,
  UpdateEpicParams,
  DeleteEpicParams,
  ListEpicsParams,
} from "@workspace/api-zod";
import { recordActivity } from "../lib/activity";

/** Aggregate story counts and points for an epic. */
async function epicSummary(epicId: number) {
  const [agg] = await db
    .select({
      storyCount: sql<number>`COUNT(*)`.as("story_count"),
      storyPoints: sql<number>`COALESCE(SUM(${storiesTable.storyPoints}), 0)`.as(
        "story_points",
      ),
      storiesDone: sql<number>`COALESCE(SUM(CASE WHEN ${storiesTable.status} = 'done' THEN 1 ELSE 0 END), 0)`.as(
        "stories_done",
      ),
    })
    .from(storiesTable)
    .where(eq(storiesTable.epicId, epicId));
  return {
    storyCount: Number(agg?.storyCount ?? 0),
    storyPoints: Number(agg?.storyPoints ?? 0),
    storiesDone: Number(agg?.storiesDone ?? 0),
  };
}

const router: IRouter = Router();

router.get("/projects/:projectId/epics", async (req, res): Promise<void> => {
  const params = ListEpicsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(epicsTable)
    .where(eq(epicsTable.projectId, params.data.projectId))
    .orderBy(epicsTable.createdAt);
  const withCounts = await Promise.all(
    rows.map(async (epic) => ({
      ...epic,
      ...(await epicSummary(epic.id)),
    })),
  );
  res.json(withCounts);
});

router.post(
  "/projects/:projectId/epics",
  async (req, res): Promise<void> => {
    const params = CreateEpicParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateEpicBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(epicsTable)
      .values({
        projectId: params.data.projectId,
        title: parsed.data.title,
        summary: parsed.data.summary ?? null,
        status: parsed.data.status ?? "planned",
        color: parsed.data.color ?? "navy",
      })
      .returning();
    await recordActivity({
      kind: "epic.created",
      message: `Epic "${row!.title}" was created`,
      projectId: params.data.projectId,
    });
    res.status(201).json(row);
  },
);

router.get("/epics/:epicId", async (req, res): Promise<void> => {
  const params = GetEpicParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [epic] = await db
    .select()
    .from(epicsTable)
    .where(eq(epicsTable.id, params.data.epicId));
  if (!epic) {
    res.status(404).json({ error: "Epic not found" });
    return;
  }
  const stories = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.epicId, epic.id))
    .orderBy(storiesTable.rank, storiesTable.createdAt);
  res.json({ ...epic, ...(await epicSummary(epic.id)), stories });
});

router.patch("/epics/:epicId", async (req, res): Promise<void> => {
  const params = UpdateEpicParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEpicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(epicsTable)
    .set({
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.summary !== undefined && { summary: parsed.data.summary }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.color !== undefined && { color: parsed.data.color }),
    })
    .where(eq(epicsTable.id, params.data.epicId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Epic not found" });
    return;
  }
  await recordActivity({
    kind: "epic.updated",
    message: `Epic "${row.title}" was updated`,
    projectId: row.projectId,
  });
  res.json(row);
});

router.delete("/epics/:epicId", async (req, res): Promise<void> => {
  const params = DeleteEpicParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(epicsTable)
    .where(eq(epicsTable.id, params.data.epicId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Epic not found" });
    return;
  }
  await recordActivity({
    kind: "epic.deleted",
    message: `Epic "${row.title}" was deleted`,
    projectId: row.projectId,
  });
  res.sendStatus(204);
});

export default router;
