# API Documentation

The API is contract-first and defined in `lib/api-spec/openapi.yaml`. Codegen produces two important artifacts:

- `lib/api-zod/src/generated/api.ts` — Zod schemas used by the server for validation.
- `lib/api-client-react/src/generated/api.ts` — Typed React Query hooks used by the frontend.

Run the app locally and open the interactive Swagger UI at `/api/docs` (API server defaults to port 3000 in development).

Primary endpoints (selected)

- `POST /api/projects` — Create a project
	- Request body (CreateProjectInput): { key: string (1-10 chars), name: string, description?: string|null, ownerId?: number|null }
	- Response: created `Project` object. Note: `key` is uppercased by the server on insert; keys are unique.

- `GET /api/projects` — List project summaries (includes task/story counts and owner)

- `GET /api/projects/:projectId` — Get project with stories and tasks

- `POST /api/projects/:projectId/stories` — Create a story under a project

- `POST /api/stories/:storyId/tasks` — Create a task under a story

- `PATCH /api/tasks/:taskId` — Update a task; status/assignee changes enqueue notifications.

- `GET /api/notifications` — Read the notifications outbox (dev/debug surface)

Errors and validation

- Validation errors return 400 with structured messages from Zod. Server may also return 400 for business constraints (for example duplicate project key).

Authentication

- The project integrates Clerk for authentication in production; development mode supports a simplified flow. See `artifacts/api-server` for middleware wiring.

Client usage (frontend)

- The frontend imports generated hooks like `useListProjects()` and `useCreateProject()` from `@workspace/api-client-react`.
- Mutations and queries use TanStack Query and handle cache invalidation via exported `get*QueryKey` helpers.

Tracing problems

- If a create/update fails with 400, check the API response JSON for `details` or `error` keys, and inspect server logs (pino) for warnings. Duplicate keys and schema mismatches are common causes during development.