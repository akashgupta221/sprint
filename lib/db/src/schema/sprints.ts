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
import { projectsTable } from "./projects";

/**
 * Time-boxed sprints. A project has at most one active sprint at a time;
 * stories attach to a sprint via stories.sprint_id (null = backlog).
 */
export const sprintsTable = pgTable("sprints", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goal: text("goal"),
  status: varchar("status", { length: 16 }).notNull().default("planned"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertSprintSchema = createInsertSchema(sprintsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSprint = z.infer<typeof insertSprintSchema>;
export type Sprint = typeof sprintsTable.$inferSelect;
