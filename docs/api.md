# API Documentation

The API is defined in OpenAPI (`lib/api-spec/openapi.yaml`).

## Main Endpoints
- `/api/projects` — CRUD for projects
- `/api/projects/:projectId/stories` — CRUD for stories
- `/api/stories/:storyId/tasks` — CRUD for tasks
- `/api/notifications` — List notification outbox
- `/api/dashboard/summary` — Project/task/story stats

All endpoints use JSON. See Swagger UI at `/api/docs` when running locally.