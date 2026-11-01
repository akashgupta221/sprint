import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { storiesTable } from "./stories";
import { tasksTable } from "./tasks";
import { membersTable } from "./members";

/**
 * Threaded-at-the-issue-level comments. A comment attaches to exactly one
 * story or task within a project; @mentions inside the body fan out to the
 * durable notification outbox.
 */
export const commentsTable = pgTable(
  "comments",
  {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  storyId: integer("story_id").references(() => storiesTable.id, {
    onDelete: "cascade",
  }),
  taskId: integer("task_id").references(() => tasksTable.id, {
    onDelete: "cascade",
  }),
  authorId: integer("author_id").references(() => membersTable.id, {
    onDelete: "set null",
  }),
  authorName: text("author_name").notNull().default("Someone"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
},
  (table) => [
    index("comments_story_idx").on(table.storyId),
    index("comments_task_idx").on(table.taskId),
  ],
);

export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
