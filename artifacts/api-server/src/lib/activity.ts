import { db, activityTable } from "@workspace/db";

export interface RecordActivityInput {
  kind: string;
  message: string;
  projectId?: number | null;
  storyId?: number | null;
  taskId?: number | null;
  actorId?: number | null;
}

export async function recordActivity(input: RecordActivityInput): Promise<void> {
  await db.insert(activityTable).values({
    kind: input.kind,
    message: input.message,
    projectId: input.projectId ?? null,
    storyId: input.storyId ?? null,
    taskId: input.taskId ?? null,
    actorId: input.actorId ?? null,
  });
}
