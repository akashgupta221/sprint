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

export const activityTable = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 64 }).notNull(),
  message: text("message").notNull(),
  projectId: integer("project_id"),
  storyId: integer("story_id"),
  taskId: integer("task_id"),
  actorId: integer("actor_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({
  id: true,
  createdAt: true,
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ActivityEvent = typeof activityTable.$inferSelect;
