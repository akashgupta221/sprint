import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, activityTable } from "@workspace/db";
import { resolveMember } from "../lib/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  // First-login linkage: make sure the signed-in Clerk user has a member row.
  await resolveMember(req as any).catch(() => null);

  // Single round trip: one SQL statement computes every aggregate.
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM projects) AS project_count,
      (SELECT COUNT(*) FROM members) AS member_count,
      (SELECT COUNT(*) FROM stories) AS story_count,
      (SELECT COUNT(*) FROM tasks) AS task_count,
      (SELECT COUNT(*) FROM tasks WHERE status = 'todo') AS tasks_todo,
      (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') AS tasks_in_progress,
      (SELECT COUNT(*) FROM tasks WHERE status = 'blocked') AS tasks_blocked,
      (SELECT COUNT(*) FROM tasks WHERE status = 'done') AS tasks_done,
      (SELECT COUNT(*) FROM stories WHERE status = 'backlog') AS stories_backlog,
      (SELECT COUNT(*) FROM stories WHERE status = 'ready') AS stories_ready,
      (SELECT COUNT(*) FROM stories WHERE status = 'in_progress') AS stories_in_progress,
      (SELECT COUNT(*) FROM stories WHERE status = 'review') AS stories_review,
      (SELECT COUNT(*) FROM stories WHERE status = 'done') AS stories_done,
      (SELECT COUNT(*) FROM notifications WHERE status IN ('pending','sending','failed')) AS notifications_pending,
      (SELECT COUNT(*) FROM notifications WHERE status = 'dead_letter') AS notifications_failed
  `);
  const row = (result as any).rows[0] ?? {};

  res.json({
    projectCount: Number(row.project_count ?? 0),
    memberCount: Number(row.member_count ?? 0),
    storyCount: Number(row.story_count ?? 0),
    taskCount: Number(row.task_count ?? 0),
    tasksByStatus: {
      todo: Number(row.tasks_todo ?? 0),
      in_progress: Number(row.tasks_in_progress ?? 0),
      blocked: Number(row.tasks_blocked ?? 0),
      done: Number(row.tasks_done ?? 0),
    },
    storiesByStatus: {
      backlog: Number(row.stories_backlog ?? 0),
      ready: Number(row.stories_ready ?? 0),
      in_progress: Number(row.stories_in_progress ?? 0),
      review: Number(row.stories_review ?? 0),
      done: Number(row.stories_done ?? 0),
    },
    notificationsPending: Number(row.notifications_pending ?? 0),
    notificationsFailed: Number(row.notifications_failed ?? 0),
    emailConfigured: Boolean(process.env.SMTP_HOST),
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
