# Security Considerations

This section explains the security posture and practical guidance for hardening both development and production deployments.

Current protections (what exists in this repo)

- Input validation: All API payloads are validated with Zod schemas generated from the OpenAPI spec. Validation occurs server-side before any DB writes.
- Parameterized queries: Drizzle ORM produces parameterized SQL preventing classic SQL injection vectors.
- Secret handling: `.env` files are used for configuration and are excluded from version control; example env files are provided for clarity.
- Error handling: The API intentionally avoids leaking stack traces to clients and returns sanitized error messages.

Practical steps to harden production

1. Use a secrets manager (Vault, AWS Parameter Store, or similar) for DB credentials, Clerk keys, and SMTP credentials rather than environment files.
2. Enable TLS for all inbound traffic and ensure SMTP/TLS credentials are stored and used securely.
3. Run the notification worker as a separate service with its own credentials and rate limits to reduce blast radius.
4. Configure monitoring/alerts for `notifications` entries hitting `dead_letter` state and for repeated validation errors.

Authorization recommendation

- Implement per-project RBAC: owners, maintainers, viewers with scoped access checks in route handlers.
- Add policy tests to ensure no endpoint leaks data to unauthorized users.

Audit and logging

- Keep pino logs centralized (e.g., Logflare, Datadog) and ensure sensitive data (PII, tokens) is redacted before logging.

Note on development convenience

This repo favors faster local iteration. Before productionizing, move from `.env`-based secrets to a managed solution and separate worker processes from the API.
