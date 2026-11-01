import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { epicsTable } from "./epics";
import { sprintsTable } from "./sprints";
import { membersTable } from "./members";

export const storiesTable = pgTable(
  "stories",
  {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  acceptanceCriteria: text("acceptance_criteria"),
  // Jira-style issue type and workflow position
  type: varchar("type", { length: 16 }).notNull().default("story"),
  status: varchar("status", { length: 16 }).notNull().default("backlog"),
  priority: varchar("priority", { length: 16 }).notNull().default("medium"),
  storyPoints: integer("story_points"),
  // hierarchy + planning
  epicId: integer("epic_id").references(() => epicsTable.id, {
    onDelete: "set null",
  }),
  sprintId: integer("sprint_id").references(() => sprintsTable.id, {
    onDelete: "set null",
  }),
  assigneeId: integer("assignee_id").references(() => membersTable.id, {
    onDelete: "set null",
  }),
  // simple tag list, e.g. ["frontend", "auth"]
  labels: text("labels").array().notNull().default([]),
  rank: integer("rank").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
},
  (table) => [
    index("stories_project_sprint_rank_idx").on(table.projectId, table.sprintId, table.rank),
    index("stories_epic_idx").on(table.epicId),
    index("stories_assignee_idx").on(table.assigneeId),
  ],
);

export const insertStorySchema = createInsertSchema(storiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof storiesTable.$inferSelect;
