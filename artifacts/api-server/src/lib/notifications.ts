import { db, notificationsTable, type Notification } from "@workspace/db";

export interface EnqueueNotificationInput {
  kind: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  relatedTaskId?: number | null;
  maxAttempts?: number;
}

/**
 * Enqueue an email notification by inserting it into the persistent outbox.
 * The async worker will pick it up on its next tick.
 */
export async function enqueueNotification(
  input: EnqueueNotificationInput,
): Promise<Notification> {
  const [row] = await db
    .insert(notificationsTable)
    .values({
      kind: input.kind,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName ?? null,
      subject: input.subject,
      body: input.body,
      relatedTaskId: input.relatedTaskId ?? null,
      maxAttempts: input.maxAttempts ?? 5,
      status: "pending",
      attempts: 0,
      nextAttemptAt: new Date(),
    })
    .returning();
  return row!;
}
