import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { RetryNotificationParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .orderBy(sql`${notificationsTable.createdAt} DESC`)
    .limit(100);
  res.json(rows);
});

router.post(
  "/notifications/:notificationId/retry",
  async (req, res): Promise<void> => {
    const params = RetryNotificationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [existing] = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, params.data.notificationId));
    if (!existing) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    const [row] = await db
      .update(notificationsTable)
      .set({
        status: "pending",
        attempts: 0,
        lastError: null,
        nextAttemptAt: new Date(),
      })
      .where(eq(notificationsTable.id, params.data.notificationId))
      .returning();
    res.json(row);
  },
);

export default router;
