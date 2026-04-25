# Database Schema (Simplified)

- **members**: id, name, email, role, createdAt
- **projects**: id, key, name, description, status, ownerId
- **stories**: id, projectId, title, description, status, priority, storyPoints
- **tasks**: id, storyId, title, description, status, assigneeId, estimateHours, dueDate
- **activity_events**: id, kind, message, projectId, storyId, taskId, createdAt
- **notifications**: id, kind, recipient_email, subject, body, status, attempts, nextAttemptAt, sentAt, lastError

All tables use timezone-aware timestamps. See `/lib/db/src/schema/` for full details.