# Design Decisions & Tradeoffs

- **Contract-first API**: OpenAPI spec is the single source of truth. Prevents type drift, but adds a codegen step.
- **Drizzle ORM**: Chosen for type safety and SQL transparency. Requires more SQL knowledge than some ORMs.
- **Notification outbox**: Durable, async email delivery via Postgres. Adds complexity but ensures reliability.
- **Monorepo**: All code in one workspace for easier refactoring and type sharing.
