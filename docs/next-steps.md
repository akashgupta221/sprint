# What Would Be Improved or Built Next

This is a prioritized list of practical improvements if more time were available. Items are ordered roughly by impact vs. implementation effort.

1) Fine-grained authorization (high impact)
- Implement RBAC scoped to projects and teams. Add middleware checks and data filters so users only see permitted projects.

2) Versioned DB migrations (high impact)
- Replace `drizzle push` in production workflows with explicit, testable migrations (e.g., `drizzle-kit` migrations or another migration tool). Add CI checks.

3) Separate notification worker (medium impact)
- Run the worker as a separate service (container) with its own concurrency controls and observability. Add metrics for delivery latency, attempts, and dead-letter counts.

4) Tests & CI (medium impact)
- Add unit tests for critical helpers and integration tests for create/update flows (projects → stories → tasks), including notification enqueueing.

5) UX & accessibility (medium/low effort)
- Improve forms, keyboard navigation, and ARIA attributes. Perform a basic Lighthouse accessibility check.

6) Real-time updates (optional)
- Add WebSocket or server-sent events to push task status updates to clients for a more responsive UI.

7) Observability and production readiness
- Add structured logs, tracing (OpenTelemetry), and alerting for critical paths (worker failures, dead letters, DB errors).

Each of these items can be scoped into 1–3 PRs with tests and rollout plans. If you want, I can draft issue templates and a first PR for any of the items above.
