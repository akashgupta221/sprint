# Sprint — Agile Project Management

Sprint is a polished agile planning tool built for software teams. It combines a modern React frontend, a typed Express API, and a durable PostgreSQL-backed async notification pipeline.

The product models the real-world workflow teams use every day:

- `Project`
  - `User Story`
    - `Task`

This repo is designed as a **pnpm monorepo** with these main pieces:

- `artifacts/agile-pm` — React + Vite frontend served at `/`
- `artifacts/api-server` — Express API served at `/api`
- `lib/api-spec/openapi.yaml` — shared OpenAPI contract for both frontend and backend
- `lib/db` — Drizzle ORM schema definitions for Postgres

---

## Why Sprint is interesting

- **Shared API contract**: one OpenAPI spec drives both server validation and frontend API clients.
- **Typed end-to-end**: API requests and responses are generated into TypeScript code for strong type safety.
- **Async email workflow**: task assignment and status change notifications are queued into a durable `notifications` table and delivered by a background worker.
- **Real-time observability**: the UI exposes the notification queue, retries, dead-letter entries, and delivery status.
- **Clean separation of concerns**: user-facing requests are fast, background work is reliable.

---

## Quick start

```bash
pnpm install
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run seed
pnpm dev
```

Then visit:

- Web app: `/`
- API: `/api`
- Swagger UI: `/api/docs`
- Healthcheck: `/api/healthz`

---

## What’s in the repo

### Frontend — `artifacts/agile-pm`

- React + Vite app
- Wouter routing
- Clerk auth integration for optional sign-in flows
- React Query for data fetching
- Generated API hooks from `@workspace/api-client-react`
- Pages for dashboard, projects, stories, team, and notifications

### Backend — `artifacts/api-server`

- Express 5 API
- Modular route files for each resource
- Validation using generated Zod schemas from `@workspace/api-zod`
- Drizzle ORM for Postgres queries
- Background notification worker with retry and dead-letter handling

### Shared libraries

- `lib/api-spec/openapi.yaml` — the single source of truth for API shape
- `lib/api-client-react` — generated client code for frontend hooks
- `lib/api-zod` — generated request/response validation schemas
- `lib/db` — database schema definitions and connection setup

---

## Core workflow

### Project hierarchy

A typical Sprint workflow is:

- Create a **Project**
- Add **Stories** to the project
- Add **Tasks** to stories
- Assign tasks to **Members**
- Change task **status** and track progress

### What happens when a task changes

1. The frontend sends a request to the API.
2. The backend validates the request using generated Zod schemas.
3. The backend writes the change to the database.
4. An activity event is recorded for the dashboard feed.
5. If the task is assigned or its status changes, an email notification is enqueued.

That keeps the UI responsive while email delivery happens asynchronously.

---

## Async email notifications

This is the standout feature of Sprint.

### How it works

- A notification row is inserted into the `notifications` table with `status = pending`.
- A background worker polls the table every few seconds.
- The worker claims due notifications using `FOR UPDATE SKIP LOCKED` so multiple workers are safe.
- The worker sends email via Nodemailer.
- Success updates the row to `sent`.
- Failure updates the row to `failed` and schedules a retry with exponential backoff.
- Once the retry budget is exhausted, the row becomes `dead_letter`.

### Why this matters

- Delivery is durable even if the server restarts.
- The user request does not depend on email delivery.
- Retry logic handles transient failures.
- The notification queue is observable in the UI.

---

## Database model

Key tables:

- `members` — team members with `name`, `email`, `role`
- `projects` — top-level container with status and owner
- `stories` — user stories under a project
- `tasks` — work items under a story with assignee, due dates, and status
- `activity_events` — feed events used by the dashboard
- `notifications` — durable email outbox for async delivery

Refer to `lib/db/src/schema/*` for the exact table definitions.

---

## Configuration

The project uses environment variables for runtime configuration.

These example files are provided to keep secrets out of git:

- `.env.example`
- `artifacts/api-server/.env.example`
- `artifacts/agile-pm/.env.example`

Do not commit real credentials into source control.

Important environment variables:

- `DATABASE_URL` — Postgres connection string
- `PORT` — API server port
- `SESSION_SECRET` — auth session secret
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` — email provider settings
- `EMAIL_FROM` — from address for email notifications
- `NOTIFICATION_POLL_MS` — worker polling frequency
- `NOTIFICATION_BATCH_SIZE` — max notifications claimed per tick

---

## Security and privacy

This repository now includes safer defaults:

- `.gitignore` excludes `.env`, `.env.*`, and secret files like `*.key`, `*.pem`, `*.crt`
- example env templates are provided instead of real secrets
- server input validation is enforced by generated Zod schemas
- database queries use Drizzle ORM and parameterized SQL
- authentication is enforced on API routes through Clerk middleware and `requireAuth`

If secrets were committed previously, rotate them immediately because git history can still contain sensitive values.

---

## Manual testing guide

1. Open the app at `/` and sign in using the local auth fallback or Clerk.
2. Visit **Projects** and open a seeded project.
3. Create a task, assign it to a member, or change a task status.
4. Open **Notifications** and watch the queue update.
5. The dashboard shows pending and failed notification counts.
6. If you want to test failure handling, configure an invalid SMTP host and restart the server. Failed notifications will appear and can be retried manually.

---

## What’s next

This repo is already a strong demo, but if it were production-ready, the next improvements would be:

- Connect authenticated Clerk users to workspace members.
- Replace `drizzle-kit push` with versioned migrations.
- Extract the notification worker into a separate service.
- Add real-time updates with Server-Sent Events or WebSockets.
- Add automated tests for API routes and critical UI flows.
- Harden permissions so notification data is only visible to intended users.

---

## Credits

Built as a complete agile project management demo with a strong focus on typed API contracts, durable async workflows, and a clean React + Express architecture.

For a secure development workflow, see `SECURITY.md`.
