import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tasksTable } from "./tasks";

/**
 * Persistent email outbox table backing the async notification worker.
 *
 * Lifecycle:
 *   pending  -> the worker will pick this up at or after `nextAttemptAt`
 *   sending  -> claimed by a worker (lease)
 *   sent     -> successfully delivered
 *   failed   -> the last attempt failed; may be retried with exponential backoff
 *   dead_letter -> attempts exhausted; requires manual retry
 */
export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 64 }).notNull(),
  recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  lastError: text("last_error"),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  relatedTaskId: integer("related_task_id").references(() => tasksTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertNotificationSchema = createInsertSchema(
  notificationsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
