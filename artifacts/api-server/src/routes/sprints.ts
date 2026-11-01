import { Router, type IRouter } from "express";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import {
  db,
  membersTable,
  sprintsTable,
  storiesTable,
} from "@workspace/db";
import {
  AddStoriesToSprintBody,
  AddStoriesToSprintParams,
  CreateSprintBody,
  CreateSprintParams,
  DeleteSprintParams,
  GetSprintParams,
  GetSprintBurndownParams,
  ListSprintsParams,
  RemoveStoriesFromSprintBody,
  RemoveStoriesFromSprintParams,
  StartSprintParams,
  CompleteSprintParams,
  UpdateSprintBody,
  UpdateSprintParams,
} from "@workspace/api-zod";
import { recordActivity } from "../lib/activity";
import { enqueueNotification } from "../lib/notifications";

async function sprintWithStories(sprintId: number) {
  const [sprint] = await db
    .select()
    .from(sprintsTable)
    .where(eq(sprintsTable.id, sprintId));
  if (!sprint) return null;
  const rows = await db
    .select({ story: storiesTable, assignee: membersTable })
    .from(storiesTable)
    .leftJoin(membersTable, eq(storiesTable.assigneeId, membersTable.id))
    .where(eq(storiesTable.sprintId, sprintId))
    .orderBy(storiesTable.rank, storiesTable.createdAt);
  const stories = rows.map((r: any) => ({
    ...(r as any).story,
    assignee: (r as any).assignee,
  }));
  return {
    ...sprint,
    storyCount: stories.length,
    totalPoints: stories.reduce((sum, s: any) => sum + (s.storyPoints ?? 0), 0),
    donePoints: stories
      .filter((s: any) => s.status === "done")
      .reduce((sum, s: any) => sum + (s.storyPoints ?? 0), 0),
    stories,
  };
}

async function notifyProjectMembers(
  projectId: number,
  kind: string,
  subject: string,
  body: string,
) {
  const everyone = await db.select().from(membersTable);
  for (const member of everyone) {
    await enqueueNotification({
      kind,
      recipientEmail: member.email,
      recipientName: member.name,
      subject,
      body,
    });
  }
}

const router: IRouter = Router();

router.get("/projects/:projectId/sprints", async (req, res): Promise<void> => {
  const params = ListSprintsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(sprintsTable)
    .where(eq(sprintsTable.projectId, params.data.projectId))
    .orderBy(sql`CASE ${sprintsTable.status} WHEN 'active' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END`, sprintsTable.createdAt);
  const withCounts = await Promise.all(
    rows.map(async (sprint) => {
      const summary = await sprintWithStories(sprint.id);
      const { stories, ...rest } = summary!;
      return rest;
    }),
  );
  res.json(withCounts);
});

router.post(
  "/projects/:projectId/sprints",
  async (req, res): Promise<void> => {
    const params = CreateSprintParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateSprintBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(sprintsTable)
      .values({
        projectId: params.data.projectId,
        name: parsed.data.name,
        goal: parsed.data.goal ?? null,
        status: "planned",
        startDate: parsed.data.startDate ?? null,
        endDate: parsed.data.endDate ?? null,
      })
      .returning();
    await recordActivity({
      kind: "sprint.created",
      message: `Sprint "${row!.name}" was created`,
      projectId: params.data.projectId,
    });
    res.status(201).json(row);
  },
);

router.get("/sprints/:sprintId", async (req, res): Promise<void> => {
  const params = GetSprintParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const summary = await sprintWithStories(params.data.sprintId);
  if (!summary) {
    res.status(404).json({ error: "Sprint not found" });
    return;
  }
  res.json(summary);
});

router.patch("/sprints/:sprintId", async (req, res): Promise<void> => {
  const params = UpdateSprintParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSprintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(sprintsTable)
    .set({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.goal !== undefined && { goal: parsed.data.goal }),
      ...(parsed.data.startDate !== undefined && { startDate: parsed.data.startDate }),
      ...(parsed.data.endDate !== undefined && { endDate: parsed.data.endDate }),
    })
    .where(eq(sprintsTable.id, params.data.sprintId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Sprint not found" });
    return;
  }
  await recordActivity({
    kind: "sprint.updated",
    message: `Sprint "${row.name}" was updated`,
    projectId: row.projectId,
  });
  res.json(row);
});

router.delete("/sprints/:sprintId", async (req, res): Promise<void> => {
  const params = DeleteSprintParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  // Stories return to the backlog before the sprint row is removed.
  await db
    .update(storiesTable)
    .set({ sprintId: null, status: "backlog" })
    .where(eq(storiesTable.sprintId, params.data.sprintId));
  const [row] = await db
    .delete(sprintsTable)
    .where(eq(sprintsTable.id, params.data.sprintId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Sprint not found" });
    return;
  }
  await recordActivity({
    kind: "sprint.deleted",
    message: `Sprint "${row.name}" was deleted`,
    projectId: row.projectId,
  });
  res.sendStatus(204);
});

router.post(
  "/sprints/:sprintId/stories",
  async (req, res): Promise<void> => {
    const params = AddStoriesToSprintParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = AddStoriesToSprintBody.safeParse(req.body);
    if (!parsed.success || parsed.data.storyIds.length === 0) {
      res.status(400).json({ error: parsed.success ? "storyIds must not be empty" : parsed.error.message });
      return;
    }
    const [sprint] = await db
      .select()
      .from(sprintsTable)
      .where(eq(sprintsTable.id, params.data.sprintId));
    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }
    await db
      .update(storiesTable)
      .set({ sprintId: sprint.id })
      .where(
        and(
          inArray(storiesTable.id, parsed.data.storyIds),
          eq(storiesTable.projectId, sprint.projectId),
        ),
      );
    await recordActivity({
      kind: "sprint.stories_added",
      message: `${parsed.data.storyIds.length} story(s) added to sprint "${sprint.name}"`,
      projectId: sprint.projectId,
    });
    res.json(await sprintWithStories(sprint.id));
  },
);

router.post(
  "/sprints/:sprintId/stories/remove",
  async (req, res): Promise<void> => {
    const params = RemoveStoriesFromSprintParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = RemoveStoriesFromSprintBody.safeParse(req.body);
    if (!parsed.success || parsed.data.storyIds.length === 0) {
      res.status(400).json({ error: parsed.success ? "storyIds must not be empty" : parsed.error.message });
      return;
    }
    const [sprint] = await db
      .select()
      .from(sprintsTable)
      .where(eq(sprintsTable.id, params.data.sprintId));
    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }
    await db
      .update(storiesTable)
      .set({ sprintId: null, status: "backlog" })
      .where(
        and(
          inArray(storiesTable.id, parsed.data.storyIds),
          eq(storiesTable.sprintId, sprint.id),
        ),
      );
    await recordActivity({
      kind: "sprint.stories_removed",
      message: `${parsed.data.storyIds.length} story(s) moved back to the backlog`,
      projectId: sprint.projectId,
    });
    res.json(await sprintWithStories(sprint.id));
  },
);

router.post("/sprints/:sprintId/start", async (req, res): Promise<void> => {
  const params = StartSprintParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [sprint] = await db
    .select()
    .from(sprintsTable)
    .where(eq(sprintsTable.id, params.data.sprintId));
  if (!sprint) {
    res.status(404).json({ error: "Sprint not found" });
    return;
  }
  if (sprint.status !== "planned") {
    res.status(409).json({ error: "Only a planned sprint can be started" });
    return;
  }
  const [active] = await db
    .select()
    .from(sprintsTable)
    .where(
      and(
        eq(sprintsTable.projectId, sprint.projectId),
        eq(sprintsTable.status, "active"),
        ne(sprintsTable.id, sprint.id),
      ),
    );
  if (active) {
    res.status(409).json({
      error: `Sprint "${active.name}" is already active — complete it first`,
    });
    return;
  }
  // Board-ready: stories waiting in the backlog become visible on the board.
  await db
    .update(storiesTable)
    .set({ status: "ready" })
    .where(
      and(
        eq(storiesTable.sprintId, sprint.id),
        eq(storiesTable.status, "backlog"),
      ),
    );
  const [row] = await db
    .update(sprintsTable)
    .set({ status: "active", startDate: new Date() })
    .where(eq(sprintsTable.id, sprint.id))
    .returning();
  await recordActivity({
    kind: "sprint.started",
    message: `Sprint "${row!.name}" started`,
    projectId: row!.projectId,
  });
  await notifyProjectMembers(
    row!.projectId,
    "sprint.started",
    `Sprint "${row!.name}" started`,
    `A new sprint has started${row!.goal ? ` — goal: ${row!.goal}` : ""}. Check your board for what's in play.`,
  );
  res.json(row);
});

router.post("/sprints/:sprintId/complete", async (req, res): Promise<void> => {
  const params = CompleteSprintParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [sprint] = await db
    .select()
    .from(sprintsTable)
    .where(eq(sprintsTable.id, params.data.sprintId));
  if (!sprint) {
    res.status(404).json({ error: "Sprint not found" });
    return;
  }
  if (sprint.status !== "active") {
    res.status(409).json({ error: "Only the active sprint can be completed" });
    return;
  }
  // Unfinished stories go back to the backlog, Jira-style.
  const unfinished = await db
    .update(storiesTable)
    .set({ sprintId: null, status: "backlog" })
    .where(
      and(
        eq(storiesTable.sprintId, sprint.id),
        ne(storiesTable.status, "done"),
      ),
    )
    .returning();
  const [row] = await db
    .update(sprintsTable)
    .set({ status: "completed", endDate: new Date() })
    .where(eq(sprintsTable.id, sprint.id))
    .returning();
  await recordActivity({
    kind: "sprint.completed",
    message: `Sprint "${row!.name}" completed — ${unfinished.length} unfinished story(s) returned to the backlog`,
    projectId: row!.projectId,
  });
  await notifyProjectMembers(
    row!.projectId,
    "sprint.completed",
    `Sprint "${row!.name}" completed`,
    `The sprint is closed. ${unfinished.length} unfinished story(s) moved back to the backlog.`,
  );
  res.json(row);
});

router.get("/sprints/:sprintId/burndown", async (req, res): Promise<void> => {
  const params = GetSprintBurndownParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [sprint] = await db
    .select()
    .from(sprintsTable)
    .where(eq(sprintsTable.id, params.data.sprintId));
  if (!sprint) {
    res.status(404).json({ error: "Sprint not found" });
    return;
  }
  const stories = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.sprintId, sprint.id));
  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);

  const start = sprint.startDate
    ? new Date(sprint.startDate)
    : new Date(sprint.createdAt);
  const end = sprint.endDate
    ? new Date(sprint.endDate)
    : new Date(start.getTime() + 14 * 24 * 3600 * 1000);
  const today = new Date();
  const lastDay = today < end ? today : end;

  const dayMs = 24 * 3600 * 1000;
  const days: { date: Date; remainingPoints: number; idealPoints: number }[] = [];
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs));

  for (let t = start.getTime(); t < lastDay.getTime() + dayMs; t += dayMs) {
    const day = new Date(t);
    const dayEnd = new Date(Math.min(t + dayMs, lastDay.getTime() + dayMs));
    const donePoints = stories
      .filter(
        (s) =>
          s.status === "done" &&
          s.updatedAt &&
          new Date(s.updatedAt).getTime() <= dayEnd.getTime(),
      )
      .reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
    const elapsedDays = Math.round((day.getTime() - start.getTime()) / dayMs);
    days.push({
      date: day,
      remainingPoints: Math.max(0, totalPoints - donePoints),
      idealPoints:
        Math.round((totalPoints * (totalDays - elapsedDays)) / totalDays * 10) / 10,
    });
  }

  res.json({ sprint, totalPoints, points: days });
});

export default router;
