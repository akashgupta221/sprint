import { and, eq, lte, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { logger } from "./logger";
import { getFromAddress, getTransport, getEmailMode } from "./email";

const POLL_INTERVAL_MS = Number(process.env.NOTIFICATION_POLL_MS ?? "5000");
const BATCH_SIZE = Number(process.env.NOTIFICATION_BATCH_SIZE ?? "10");
const BACKOFF_BASE_MS = 30_000; // 30s, doubles per attempt

let timer: NodeJS.Timeout | null = null;
let running = false;
let stopping = false;

/**
 * Compute the next retry time using exponential backoff with jitter.
 * attempt 1 -> ~30s, 2 -> ~60s, 3 -> ~2m, 4 -> ~4m, 5 -> ~8m
 */
function computeNextAttemptAt(attempts: number): Date {
  const exp = Math.min(attempts, 8);
  const base = BACKOFF_BASE_MS * 2 ** (exp - 1);
  const jitter = Math.floor(Math.random() * (base * 0.2));
  return new Date(Date.now() + base + jitter);
}

async function claimBatch(now: Date) {
  // Atomically claim a batch of due, pending notifications. We use a single
  // UPDATE...WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED) to prevent two
  // workers from processing the same row.
  const result = await db.execute(sql`
    WITH due AS (
      SELECT id FROM ${notificationsTable}
      WHERE ${notificationsTable.status} IN ('pending','failed')
        AND ${notificationsTable.nextAttemptAt} <= ${now}
        AND ${notificationsTable.attempts} < ${notificationsTable.maxAttempts}
      ORDER BY ${notificationsTable.nextAttemptAt} ASC
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE ${notificationsTable}
    SET status = 'sending', updated_at = NOW()
    WHERE id IN (SELECT id FROM due)
    RETURNING *;
  `);
  // drizzle's execute returns { rows: [...] }
  return (result as unknown as { rows: Array<typeof notificationsTable.$inferSelect> }).rows;
}

async function processOne(row: typeof notificationsTable.$inferSelect) {
  const transport = getTransport();
  const from = getFromAddress();
  const attempts = row.attempts + 1;

  try {
    const info = await transport.sendMail({
      from,
      to: row.recipientName
        ? `"${row.recipientName}" <${row.recipientEmail}>`
        : row.recipientEmail,
      subject: row.subject,
      text: row.body,
    });
    logger.info(
      {
        notificationId: row.id,
        kind: row.kind,
        to: row.recipientEmail,
        mode: getEmailMode(),
        messageId: info.messageId,
      },
      "Notification email sent",
    );
    await db
      .update(notificationsTable)
      .set({
        status: "sent",
        attempts,
        sentAt: new Date(),
        lastError: null,
      })
      .where(eq(notificationsTable.id, row.id));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const reachedMax = attempts >= row.maxAttempts;
    await db
      .update(notificationsTable)
      .set({
        status: reachedMax ? "dead_letter" : "failed",
        attempts,
        lastError: message,
        nextAttemptAt: reachedMax ? row.nextAttemptAt : computeNextAttemptAt(attempts),
      })
      .where(eq(notificationsTable.id, row.id));
    logger.warn(
      {
        notificationId: row.id,
        kind: row.kind,
        attempts,
        reachedMax,
        err: message,
      },
      "Notification email failed",
    );
  }
}

async function tick() {
  if (running || stopping) return;
  running = true;
  try {
    const batch = await claimBatch(new Date());
    if (batch.length === 0) return;
    logger.debug({ count: batch.length }, "Processing notification batch");
    await Promise.all(batch.map((row) => processOne(row)));
  } catch (err) {
    logger.error({ err }, "Notification worker tick failed");
  } finally {
    running = false;
  }
}

/**
 * Start the background notification worker. Idempotent — multiple calls share
 * the same timer.
 */
export function startNotificationWorker(): void {
  if (timer) return;
  logger.info({ pollMs: POLL_INTERVAL_MS, batch: BATCH_SIZE }, "Notification worker starting");
  // Run once immediately so newly-enqueued items don't wait a full interval.
  void tick();
  timer = setInterval(() => {
    void tick();
  }, POLL_INTERVAL_MS);
  // Don't keep the event loop alive solely for this timer.
  if (typeof timer.unref === "function") timer.unref();
}

export async function stopNotificationWorker(): Promise<void> {
  stopping = true;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  // Best effort: release any "sending" rows that this process claimed but
  // never finished, so a future worker re-attempts them.
  try {
    await db
      .update(notificationsTable)
      .set({ status: "pending" })
      .where(
        and(
          eq(notificationsTable.status, "sending"),
          lte(notificationsTable.updatedAt, new Date(Date.now() - 60_000)),
        ),
      );
  } catch {
    // ignore
  }
}
