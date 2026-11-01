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
 * Epics group related stories under one umbrella, Jira-style:
 * Epic -> Stories -> Tasks.
 */
export const epicsTable = pgTable("epics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary"),
  status: varchar("status", { length: 16 }).notNull().default("planned"),
  color: varchar("color", { length: 16 }).notNull().default("navy"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertEpicSchema = createInsertSchema(epicsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEpic = z.infer<typeof insertEpicSchema>;
export type Epic = typeof epicsTable.$inferSelect;
