# Security Considerations

- All API inputs validated with Zod (generated from OpenAPI)
- SQL injection prevented by Drizzle ORM
- Authentication via Clerk (JWT in prod, session in dev)
- Secrets and .env files are gitignored
- Minimal authorization: all authenticated users can see all data (improvement needed)
- No stack traces or sensitive errors leaked to clients
