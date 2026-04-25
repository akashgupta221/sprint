# Project Overview & Architecture

Sprint is a compact, solo-developed prototype for agile project management. It demonstrates a practical, production-informed architecture intended for small teams or as a learning reference. The implementation focuses on clarity, type-safety, and reliable asynchronous workflows rather than feature completeness.

Core goals:
- Keep frontend and backend types in sync via a single OpenAPI contract.
- Provide durable, observable email delivery using a Postgres outbox pattern.
- Favor explicit SQL with type inference (Drizzle) for predictable database interactions.

High-level architecture
- Frontend (React + Vite): Single-page application using generated API hooks for data access and TanStack Query for caching.
- API Server (Express): Routes validate incoming JSON using generated Zod schemas and perform atomic DB work via Drizzle.
- Database (Postgres + Drizzle): Schema lives in `lib/db/src/schema`, and small push-style sync is used during development.
- Notification worker: Background loop inside the API process that claims rows from the `notifications` outbox and delivers email via Nodemailer (or logs in dev).

Repository layout (important folders)
- `lib/api-spec/` – OpenAPI source (single source of truth for endpoints and shapes).
- `lib/api-zod/` – Generated Zod schemas used by Express routes.
- `lib/api-client-react/` – Generated React hooks (TanStack Query) used by the UI.
- `lib/db/` – Drizzle schemas and DB definition.
- `artifacts/api-server/` – Express server implementation and worker code.
- `artifacts/agile-pm/` – Frontend app (pages, components, forms).

Quick dev notes
- Run `pnpm install` at the repo root, set `.env` files from examples, then `pnpm dev` to start both frontend and backend in development mode.

Where to look first
- If you want to see the API contract: `lib/api-spec/openapi.yaml`.
- If you want to trace notifications: `artifacts/api-server/src/lib/notificationWorker.ts` and `artifacts/api-server/src/lib/email.ts`.
- For database structure: `lib/db/src/schema`.

This overview is intentionally short — the following docs dive into API, DB, and design rationale.
