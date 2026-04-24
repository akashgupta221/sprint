# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Houses **Sprint**, a full-stack
Agile project-management tool with hierarchical Project → Story → Task
tracking, an Express 5 API, async email-notification worker, and a
React+Vite frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval — generates `@workspace/api-client-react`
  (TanStack Query hooks) and `@workspace/api-zod` (Zod schemas) from
  the OpenAPI spec at `lib/api-spec/openapi.yaml`
- **Frontend**: React + Vite, wouter, TanStack Query, shadcn/ui,
  react-hook-form + zod, sonner toasts
- **Auth**: Clerk Auth (`@clerk/react` + `@clerk/express`), email +
  password by default, Google login configurable from the Auth pane.
  Public routes: `/`, `/sign-in`, `/sign-up`, `/api/healthz`,
  `/api/docs`. Everything else requires a signed-in session.
- **Async pipeline**: nodemailer + Postgres-backed outbox
  (`FOR UPDATE SKIP LOCKED`, exponential backoff, dead-letter)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/agile-pm` — React+Vite frontend (web), mounted at `/`
- `artifacts/api-server` — Express 5 API + Swagger UI + notification
  worker, mounted at `/api`
- `artifacts/mockup-sandbox` — design preview sandbox

## Application Structure

- `lib/db` — Drizzle schemas: `members`, `projects`, `stories`,
  `tasks`, `notifications`, `activity_events`
- `artifacts/api-server/src/routes` — `projects`, `stories`, `tasks`,
  `members`, `dashboard`, `notifications`, `docs` (Swagger UI at
  `/api/docs`)
- `artifacts/api-server/src/lib` — `email`, `notifications`,
  `activity`, `notificationWorker`
- `artifacts/api-server/scripts/seed.ts` — populates 4 members,
  2 projects, 4 stories, 6 tasks
- `artifacts/agile-pm/src/pages` — `Dashboard`, `Projects`,
  `ProjectDetail`, `StoryDetail`, `Team`, `Notifications`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API
  hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
  (dev only)
- `pnpm --filter @workspace/api-server run seed` — load demo data
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/agile-pm run dev` — run frontend

## Configuration

| Env Var | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Postgres connection | (provided) |
| `SESSION_SECRET` | Express session signing | (provided) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Real SMTP. If unset, nodemailer's `jsonTransport` logs the message. | unset |
| `MAIL_FROM` | "From" header | `sprint@local` |
| `NOTIFICATION_POLL_MS` | Worker poll interval | `2000` |
| `NOTIFICATION_BATCH` | Rows claimed per tick | `5` |
| `NOTIFICATION_MAX_ATTEMPTS` | Retries before dead-letter | `5` |

## Async Notification Workflow

1. Mutations (assign task, status change, add member) call
   `enqueueNotification(...)` inside the same transaction as the
   business write — atomic outbox pattern.
2. The worker polls every `NOTIFICATION_POLL_MS`, claiming up to
   `NOTIFICATION_BATCH` due rows with
   `SELECT … FOR UPDATE SKIP LOCKED` so multiple worker instances
   never deliver the same row twice.
3. Each delivery uses nodemailer; failures are recorded with the
   error and rescheduled with exponential backoff
   (`30s · 2^attempt`, capped at 1 h). After
   `NOTIFICATION_MAX_ATTEMPTS` the row moves to the
   `dead_letter` status for manual review on `/notifications`.

## See also

- `pnpm-workspace` skill — workspace structure, TS project refs
- `README.md` — product-level architecture, AI usage, "what's next"
