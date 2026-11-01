import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import {
  db,
  commentsTable,
  membersTable,
  storiesTable,
  tasksTable,
} from "@workspace/db";
import {
  CreateStoryCommentBody,
  CreateStoryCommentParams,
  CreateTaskCommentBody,
  CreateTaskCommentParams,
  DeleteCommentParams,
  ListStoryCommentsParams,
  ListTaskCommentsParams,
} from "@workspace/api-zod";
import { recordActivity } from "../lib/activity";
import { enqueueNotification } from "../lib/notifications";

/** Hard cap so one comment can never spam the whole outbox. */
const MAX_MENTIONS_PER_COMMENT = 10;

/**
 * Resolve @mention tokens against the member directory. A token matches a
 * member when it equals their first name, full name, or email local-part
 * (case-insensitive). Underscores/digits in emails are tolerated.
 */
function extractMentionTokens(body: string): string[] {
  const tokens = new Set<string>();
  for (const match of body.matchAll(/@([\w.+-]{2,64})/g)) {
    tokens.add(match[1]!.toLowerCase());
  }
  return [...tokens];
}

async function resolveMentionedMembers(
  tokens: string[],
): Promise<{ id: number; name: string; email: string }[]> {
  if (tokens.length === 0) return [];
  const members = await db.select().from(membersTable);
  return members.filter((member) => {
    const emailLocal = member.email.split("@")[0]!.toLowerCase();
    const firstName = member.name.split(" ")[0]!.toLowerCase();
    const fullName = member.name.toLowerCase().replace(/\s+/g, "");
    return tokens.some(
      (token) => token === emailLocal || token === firstName || token === fullName,
    );
  });
}

const router: IRouter = Router();

router.get("/stories/:storyId/comments", async (req, res): Promise<void> => {
  const params = ListStoryCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.storyId, params.data.storyId))
    .orderBy(asc(commentsTable.createdAt));
  res.json(rows);
});

router.get("/tasks/:taskId/comments", async (req, res): Promise<void> => {
  const params = ListTaskCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.taskId, params.data.taskId))
    .orderBy(asc(commentsTable.createdAt));
  res.json(rows);
});

router.post(
  "/stories/:storyId/comments",
  async (req, res): Promise<void> => {
    const params = CreateStoryCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateStoryCommentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [story] = await db
      .select()
      .from(storiesTable)
      .where(eq(storiesTable.id, params.data.storyId));
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    const [row] = await db
      .insert(commentsTable)
      .values({
        projectId: story.projectId,
        storyId: story.id,
        authorName: parsed.data.authorName ?? "Someone",
        body: parsed.data.body,
      })
      .returning();
    await recordActivity({
      kind: "comment.created",
      message: `${row!.authorName} commented on "${story.title}"`,
      projectId: story.projectId,
      storyId: story.id,
    });

    // @mentions fan out through the durable outbox.
    const mentioned = (
      await resolveMentionedMembers(extractMentionTokens(row!.body))
    ).slice(0, MAX_MENTIONS_PER_COMMENT);
    for (const member of mentioned) {
      await enqueueNotification({
        kind: "comment.mention",
        recipientEmail: member.email,
        recipientName: member.name,
        subject: `${row!.authorName} mentioned you on "${story.title}"`,
        body: `${row!.authorName} wrote: ${row!.body.slice(0, 500)}`,
      });
    }

    res.status(201).json(row);
  },
);

router.post(
  "/tasks/:taskId/comments",
  async (req, res): Promise<void> => {
    const params = CreateTaskCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateTaskCommentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [task] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, params.data.taskId));
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    // Tasks belong to a story, which carries the project scope.
    const [parentStory] = await db
      .select()
      .from(storiesTable)
      .where(eq(storiesTable.id, task.storyId));
    if (!parentStory) {
      res.status(404).json({ error: "Parent story not found" });
      return;
    }
    const [row] = await db
      .insert(commentsTable)
      .values({
        projectId: parentStory.projectId,
        taskId: task.id,
        authorName: parsed.data.authorName ?? "Someone",
        body: parsed.data.body,
      })
      .returning();
    await recordActivity({
      kind: "comment.created",
      message: `${row!.authorName} commented on task "${task.title}"`,
      taskId: task.id,
    });

    const mentioned = (
      await resolveMentionedMembers(extractMentionTokens(row!.body))
    ).slice(0, MAX_MENTIONS_PER_COMMENT);
    for (const member of mentioned) {
      await enqueueNotification({
        kind: "comment.mention",
        recipientEmail: member.email,
        recipientName: member.name,
        subject: `${row!.authorName} mentioned you on task "${task.title}"`,
        body: `${row!.authorName} wrote: ${row!.body.slice(0, 500)}`,
      });
    }

    res.status(201).json(row);
  },
);

router.delete("/comments/:commentId", async (req, res): Promise<void> => {
  const params = DeleteCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(commentsTable)
    .where(eq(commentsTable.id, params.data.commentId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
