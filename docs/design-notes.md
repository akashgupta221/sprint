# Design Decisions & Tradeoffs

This project is intentionally opinionated: it chose a small set of patterns that favor predictability, type safety, and clear operational behavior.

1) Contract-first API (OpenAPI → codegen)
- Rationale: Keeping the API spec first avoids drift between frontend and backend and allows code generation of client hooks and Zod schemas.
- Tradeoffs: Adds an extra build/codegen step; developers must run codegen after spec changes (`pnpm --filter @workspace/api-spec run codegen`).

2) Drizzle ORM & explicit SQL
- Rationale: Drizzle provides TypeScript inference while keeping SQL readable and explicit.
- Tradeoffs: Steeper SQL learning curve; more boilerplate for complex queries compared to heavyweight ORMs.

3) Postgres outbox for email (durable notifications)
- Rationale: Ensures request paths are fast and email delivery is durable across restarts.
- Tradeoffs: More DB schema and a worker loop to manage delivery. Worker currently co-located with the API process which simplifies dev but should be separated for scaling.

4) Monorepo structure
- Rationale: Easier to share types and generated code across frontend and backend.
- Tradeoffs: Slightly more complex repo tooling and larger install times. PNPM workspace mitigates most pain points.

5) Auth & Authorization
- Rationale: Clerk provides production-ready auth; a lightweight dev alternative reduces friction during local development.
- Tradeoffs: Fine-grained authorization (per-project/team roles) is not implemented — access model is coarse and documented as a limitation.
