import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import {
  db,
  membersTable,
  projectsTable,
  storiesTable,
  tasksTable,
  notificationsTable,
  activityTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [{ projectCount }] = await db
    .select({ projectCount: sql<number>`COUNT(*)` })
    .from(projectsTable);
  const [{ memberCount }] = await db
    .select({ memberCount: sql<number>`COUNT(*)` })
    .from(membersTable);
  const [{ storyCount }] = await db
    .select({ storyCount: sql<number>`COUNT(*)` })
    .from(storiesTable);
  const [{ taskCount }] = await db
    .select({ taskCount: sql<number>`COUNT(*)` })
    .from(tasksTable);

  const tasksByStatusRows = await db
    .select({
      status: tasksTable.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(tasksTable)
    .groupBy(tasksTable.status);
  const tasksByStatus = {
    todo: 0,
    in_progress: 0,
    blocked: 0,
    done: 0,
  } as Record<string, number>;
  for (const r of tasksByStatusRows) tasksByStatus[r.status] = Number(r.count);

  const storiesByStatusRows = await db
    .select({
      status: storiesTable.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(storiesTable)
    .groupBy(storiesTable.status);
  const storiesByStatus = {
    backlog: 0,
    ready: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  } as Record<string, number>;
  for (const r of storiesByStatusRows)
    storiesByStatus[r.status] = Number(r.count);

  const [{ pending }] = await db
    .select({
      pending: sql<number>`COUNT(*) FILTER (WHERE status IN ('pending','sending','failed'))`,
    })
    .from(notificationsTable);
  const [{ failed }] = await db
    .select({
      failed: sql<number>`COUNT(*) FILTER (WHERE status = 'dead_letter')`,
    })
    .from(notificationsTable);

  res.json({
    projectCount: Number(projectCount),
    memberCount: Number(memberCount),
    storyCount: Number(storyCount),
    taskCount: Number(taskCount),
    tasksByStatus,
    storiesByStatus,
    notificationsPending: Number(pending),
    notificationsFailed: Number(failed),
  });
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(activityTable)
    .orderBy(sql`${activityTable.createdAt} DESC`)
    .limit(20);
  res.json(rows);
});

export default router;
