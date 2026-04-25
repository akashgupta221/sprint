# Project Overview & Architecture

Sprint is a solo agile project management tool built with React, Express, PostgreSQL, and Drizzle ORM. It uses a contract-driven approach (OpenAPI) to keep backend and frontend in sync. The architecture is modular, with clear separation between API, frontend, and database layers.

## Key Features
- Project, story, and task management
- Async email notifications (Postgres outbox + worker)
- Type-safe API (OpenAPI + Zod)
- Modern React UI (Vite, shadcn/ui, TailwindCSS)
