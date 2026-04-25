
# 🏃‍♂️ Sprint — Agile Project Management

## 📺 Project Walkthrough Video

[![Sprint Walkthrough](https://img.shields.io/badge/YouTube-Project%20Demo-red?logo=youtube)](https://youtu.be/w3N1z97hYhw)


![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20PostgreSQL-blue)
![Package Manager](https://img.shields.io/badge/package-pnpm-blue)

**Sprint** is a solo full-stack agile project management prototype demonstrating modern software architecture patterns. Built with React 19, Express 5, PostgreSQL, and Drizzle ORM, it showcases **contract-driven development** where a single OpenAPI specification synchronizes server validation and frontend type safety across the entire stack. The system includes a durable, event-sourced notification pipeline with multi-instance worker safety and exponential backoff retry logic.

---

🎥 Walkthrough Highlights: Covers project overview, architecture, key features, and a quick live demo for easy understanding.

https://youtu.be/Sumf3ThXkvk


## 📦 Architecture at a Glance

### Repository Structure
```
lib/
├── api-spec/          # OpenAPI contract (single source of truth)
├── api-zod/           # Generated server validation schemas
├── api-client-react/  # Generated TanStack Query hooks
└── db/                # Drizzle ORM schemas & migrations

artifacts/
├── agile-pm/          # React 19 + Vite frontend
├── api-server/        # Express 5 REST API + notification worker
└── mockup-sandbox/    # Design system sandbox
```

### Technology Stack
| Layer | Tech |
|-------|------|
| **Frontend** | React 19, Vite 7, TanStack Query, wouter, shadcn/ui, TailwindCSS 4 |
| **Backend** | Express 5, Drizzle ORM, Zod validation |
| **Database** | PostgreSQL 15+, parameterized queries |
| **Authentication** | Clerk (production), local dev mode |
| **Email** | Nodemailer with exponential backoff retry logic |
| **Logging** | pino + pino-http |
| **Type Safety** | TypeScript 5.9, project references |

---

## 🏗 Design Decisions & Tradeoffs

### 1. Contract-First Development (OpenAPI)
**What:** API contract defined first in `openapi.yaml`, then server validators and frontend client are generated.

**Why:** Eliminates type drift. Frontend and backend always agree on request/response shapes. Changes to the contract regenerate both sides of the wire.

**Tradeoff:** Adds a codegen build step, but prevents the most common class of integration bugs.

### 2. Drizzle ORM Over Heavy ORMs
**What:** SQL-like query builder with TypeScript inference, not a black-box abstraction.

**Why:** Balances safety (parameterized queries, no SQL injection) with performance (generated SQL is readable) and transparency (you control the queries).

**Tradeoff:** Requires more SQL knowledge than Sequelize or TypeORM, but offers significantly better performance for complex queries.

### 3. Durable Notification Outbox (Postgres-Backed)
**What:** Email delivery decoupled from the request path. Changes write an activity event and notification row in the same transaction. A background worker polls and sends emails with retry logic.

**Why:**
- User requests don't block on SMTP latency.
- Emails survive server restarts (they're in Postgres, not memory).
- Multiple worker instances are safe (`FOR UPDATE SKIP LOCKED` pattern).
- Failed emails retry with exponential backoff and jitter.

**Tradeoff:** Adds complexity to the notification table schema and worker coordination, but provides production-grade reliability.

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- pnpm
- A running PostgreSQL instance

### Setup
```bash
git clone https://github.com/akashgupta221/sprint.git
cd sprint
pnpm install
```

### Environment
Create environment files from the examples and populate your secrets:
```bash
cp .env.example .env
cp artifacts/api-server/.env.example artifacts/api-server/.env
cp artifacts/agile-pm/.env.example artifacts/agile-pm/.env
```

### Database Sync
```bash
pnpm --filter @workspace/db run push
```

### Run Project
```bash
pnpm dev
```

---

## � Domain Model

### Hierarchy
```
members ──owns──→ projects ──contains──→ stories ──contains──→ tasks
                                                              ↓
                                                      assigneeId (FK)
```

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **members** | User accounts (for this solo project: typically the project owner) | id, name, email (unique), role, createdAt |
| **projects** | Planning initiatives | id, key (unique), name, description, status, ownerId |
| **stories** | Epic-level work | id, projectId, title, description, acceptanceCriteria, status, priority, storyPoints |
| **tasks** | Granular work units | id, storyId, title, description, status, assigneeId, estimateHours, dueDate |
| **activity_events** | Audit feed | id, kind, message, projectId, storyId, taskId, createdAt |
| **notifications** | Email outbox | id, kind, recipient_email, subject, body, status, attempts, nextAttemptAt, sentAt, lastError |

All timestamps are timezone-aware with automatic `updatedAt` triggers.

---

## ⚙️ How It Works: Request Lifecycle

### Example: User Updates a Task

1. **Frontend**: React component calls `useUpdateTask()` mutation (auto-generated from OpenAPI).
2. **Validation**: Express router validates the incoming payload against generated Zod schema.
3. **Authentication**: Clerk middleware (`requireAuth`) enforces the user is logged in.
4. **Atomic Write**: Drizzle performs the task update and, in the same transaction, records an `activity_event` and enqueues a `notification` row.
5. **Async Delivery**: Response returns immediately. The notification worker picks up the email delivery independently.
6. **Retry Logic**: If SMTP fails, the worker retries with exponential backoff (30s → 60s → 120s → ...). After max retries, the row moves to `dead_letter` for manual inspection.

**Why this matters:** User-facing requests are fast because they don't wait on SMTP. Email delivery is durable because it's persisted in the database.

---

## 📧 The Notification Pipeline (In Depth)

### Mechanism

1. **Polling Tick** (every 5 seconds by default):
   ```sql
   SELECT * FROM notifications 
   WHERE status = 'pending' 
   FOR UPDATE SKIP LOCKED 
   LIMIT :batch_size
   ```
   The `FOR UPDATE SKIP LOCKED` clause ensures multiple worker instances never claim the same row.

2. **Delivery Attempt**: Each claimed row is sent via Nodemailer. In development without SMTP env vars, emails are logged to stdout via `jsonTransport`.

3. **Failure Handling**:
   - Increment `attempts` counter.
   - Compute `nextAttemptAt` using exponential backoff with jitter: `base_delay * (2 ^ attempts) + random_jitter`.
   - Update `lastError` with the SMTP error message.

4. **Success**: Set `status = 'sent'` and `sentAt = now()`.

5. **Dead Letter**: If `attempts >= maxAttempts`, set `status = 'dead_letter'` for manual review.

### Safety Guarantees

- **No Double-Sends**: `FOR UPDATE SKIP LOCKED` prevents race conditions across multiple workers.
- **Restart Recovery**: On shutdown, stale `sending` rows older than 60 seconds are downgraded to `pending`.
- **Multi-Instance Ready**: Deploy multiple notification workers without special coordination.

---

## 🔐 Security & Data Integrity

Already in place:

    Secret hygiene: .env* and common key/cert file extensions gitignored; example files committed instead.
    Input validation: Zod schemas (generated from the OpenAPI spec) enforced on the API.
    SQL injection: Drizzle ORM with parameterized queries throughout; the one raw SQL block (the claim statement) parameterizes all user-influenced values.
    Authn: Clerk middleware + explicit requireAuth on protected routers.
    Email safety: when SMTP is unset, messages log via jsonTransport rather than silently blackholing — and never leak to a real recipient.

Notes the README itself calls out as follow-ups:

    If secrets were ever committed historically, rotate them — git history preserves them.
    Authorization is coarse: currently any signed-in user can see all workspace data. The README explicitly flags “harden permissions so notification data is only visible to intended users” as a to-do.
    Drizzle push is in use; versioned migrations are planned.


---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ (check with `node -v`)
- **pnpm** (install with `npm install -g pnpm`)
- **PostgreSQL** 15+ (local or cloud-hosted)

### Quick Start

```bash
# Clone and install
git clone https://github.com/akashgupta221/sprint.git
cd sprint
pnpm install

# Configure environment
cp .env.example .env
cp artifacts/api-server/.env.example artifacts/api-server/.env
cp artifacts/agile-pm/.env.example artifacts/agile-pm/.env

# Update .env with your DATABASE_URL and (optionally) SMTP credentials

# Sync database schema
pnpm --filter @workspace/db run push

# (Optional) Load demo data
pnpm --filter @workspace/api-server run seed

# Start development servers
pnpm dev
```

### Local Endpoints

| Endpoint | Purpose |
|----------|---------|
| http://localhost:4173 | Frontend (React + Vite) |
| http://localhost:3000/api | API server |
| http://localhost:3000/api/docs | Swagger UI (interactive API docs) |
| http://localhost:3000/api/healthz | Health check |

### Development Scripts

```bash
pnpm dev              # Start both frontend and API in watch mode
pnpm dev:api          # API only
pnpm dev:web          # Frontend only
pnpm build            # Full typecheck + build
pnpm typecheck        # TypeScript validation only

# Regenerate API client and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Database management
pnpm --filter @workspace/db run push        # Sync schema
pnpm --filter @workspace/api-server run seed # Load demo data
```

---

## � Environment Variables

Create `.env` files from the `.env.example` templates. Required variables:

```env
# Database (required)
DATABASE_URL=postgresql://user:pass@localhost:5432/sprint

# API (required)
PORT=3000
SESSION_SECRET=your-secret-key-here

# Email / Notifications (optional in dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@sprint.local

# Clerk Authentication (optional in dev)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Worker tuning (optional, defaults work for most cases)
NOTIFICATION_POLL_MS=5000
NOTIFICATION_BATCH_SIZE=10
NOTIFICATION_MAX_ATTEMPTS=5
```

**Note:** Without SMTP credentials, notifications are logged to stdout for development. This is intentional — prevents accidental emails during testing.

---

## 🤝 How the API Contract Works

1. **Single Source of Truth**: `/lib/api-spec/openapi.yaml` defines all endpoints, request/response shapes, and error codes.

2. **Server Validation**: Run `pnpm --filter @workspace/api-spec run codegen` to regenerate:
   - `/lib/api-zod/src/generated/api.ts` — Zod schemas for request/response validation
   - Used in every Express route to validate incoming payloads

3. **Frontend Client**: Auto-generated React Query hooks in `/lib/api-client-react/src/generated/api.ts`:
   - `useGetProjects()`, `useCreateProject()`, `useUpdateTask()`, etc.
   - Fully typed — TypeScript knows the request body shape and response type
   - Mutations and queries both pre-built with proper error handling

**Result:** Changes to the OpenAPI spec automatically propagate to both frontend and backend. Type drift is impossible.

---

## 🤖 AI & Attribution

AI tools were used to accelerate boilerplate generation, documentation, and code scaffolding. Every architectural decision, business logic, schema design, and final code quality was manually reviewed and verified. No features or claims in this README are generated or unverified.


