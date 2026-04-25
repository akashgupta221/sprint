# Database Schema (Reference)

This section summarizes key tables and where to find their full definitions in the repo. The canonical table definitions live under `lib/db/src/schema` (Drizzle table builders). Types for inserts/rows are generated via `drizzle-zod` and are available in that package.

Core tables

- `members` (users)
	- Purpose: user accounts that can be project owners or assignees.
	- Important fields: `id` (serial PK), `name`, `email` (unique), `role`, `createdAt`.

- `projects`
	- Purpose: top-level planning container.
	- Important fields: `id`, `key` (varchar, unique, uppercased on insert), `name`, `description`, `status` (default `active`), `ownerId` (FK → `members.id`).
	- See: `lib/db/src/schema/projects.ts` for types and constraints. The `key` has a unique constraint and 16-char limit in the schema.

- `stories`
	- Purpose: group of tasks inside a project.
	- Important fields: `id`, `projectId` (FK → `projects.id`), `title`, `description`, `status`, `priority`, `storyPoints`.

- `tasks`
	- Purpose: actionable work items attached to a story.
	- Important fields: `id`, `storyId` (FK → `stories.id`), `title`, `description`, `status`, `assigneeId` (FK → `members.id`), `estimateHours`, `dueDate`.

- `activity_events`
	- Purpose: audit feed of user/system actions. Written in the same transaction as core changes when appropriate.

- `notifications`
	- Purpose: outbound email outbox used by the notification worker.
	- Important fields: `id`, `kind`, `recipient_email`, `subject`, `body`, `status` (`pending|sending|sent|dead_letter`), `attempts`, `nextAttemptAt`, `sentAt`, `lastError`.

Timestamps

All tables that record time use timezone-aware timestamps (`withTimezone: true`) and have `createdAt`/`updatedAt` defaults. `updatedAt` is configured to update on writes where the database supports it.

Where to inspect types

- `lib/db/src/schema/*.ts` — actual Drizzle table definitions
- `lib/db/src/index.ts` — exports and DB connection wiring

Development guidance

- Use `pnpm --filter @workspace/db run push` to sync schema during development. For production, prefer explicit migration scripts (not currently implemented).