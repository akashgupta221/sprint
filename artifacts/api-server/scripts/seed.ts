/**
 * Seed script: idempotent baseline data for local development.
 *
 *   pnpm --filter @workspace/api-server run seed
 */
import {
  db,
  membersTable,
  projectsTable,
  storiesTable,
  tasksTable,
  activityTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding…");

  const seedMembers = [
    { name: "Ada Patel", email: "ada@sprint.local", role: "admin" },
    { name: "Marcus Reed", email: "marcus@sprint.local", role: "member" },
    { name: "Lin Wei", email: "lin@sprint.local", role: "member" },
    { name: "Jordan Kim", email: "jordan@sprint.local", role: "member" },
  ];
  const memberIds: Record<string, number> = {};
  for (const m of seedMembers) {
    const [existing] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.email, m.email));
    if (existing) {
      memberIds[m.email] = existing.id;
      continue;
    }
    const [row] = await db.insert(membersTable).values(m).returning();
    memberIds[m.email] = row!.id;
  }

  const seedProjects = [
    {
      key: "WEB",
      name: "Customer Web App",
      description:
        "Public marketing site and customer dashboard. Quarterly redesign in progress.",
      ownerEmail: "ada@sprint.local",
      stories: [
        {
          title: "Visitors can sign up with email",
          description:
            "Self-serve signup with email + password and a verification email.",
          acceptanceCriteria:
            "Signup form validates email, sends verification mail, blocks dashboard until verified.",
          priority: "high",
          storyPoints: 5,
          status: "in_progress" as const,
          tasks: [
            {
              title: "Design signup form",
              status: "done" as const,
              assigneeEmail: "lin@sprint.local",
              estimateHours: 4,
            },
            {
              title: "Wire up POST /signup",
              status: "in_progress" as const,
              assigneeEmail: "marcus@sprint.local",
              estimateHours: 6,
            },
            {
              title: "Send verification email via worker",
              status: "todo" as const,
              assigneeEmail: "marcus@sprint.local",
              estimateHours: 3,
            },
          ],
        },
        {
          title: "Members can reset their password",
          description: "Forgot-password flow with single-use token.",
          priority: "medium",
          storyPoints: 3,
          status: "ready" as const,
          tasks: [
            {
              title: "Token table + expiry",
              status: "todo" as const,
              assigneeEmail: "marcus@sprint.local",
              estimateHours: 2,
            },
          ],
        },
        {
          title: "Marketing landing refresh",
          priority: "low",
          status: "backlog" as const,
          tasks: [],
        },
      ],
    },
    {
      key: "MOB",
      name: "iOS Companion",
      description: "Read-only mobile companion for the Customer Web App.",
      ownerEmail: "jordan@sprint.local",
      stories: [
        {
          title: "Members can browse projects offline",
          priority: "high",
          storyPoints: 8,
          status: "in_progress" as const,
          tasks: [
            {
              title: "Local cache layer",
              status: "in_progress" as const,
              assigneeEmail: "jordan@sprint.local",
              estimateHours: 12,
            },
            {
              title: "Sync indicator UI",
              status: "todo" as const,
              assigneeEmail: "lin@sprint.local",
              estimateHours: 4,
            },
          ],
        },
      ],
    },
  ];

  for (const p of seedProjects) {
    const [existing] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.key, p.key));
    if (existing) {
      console.log(`  project ${p.key} already seeded — skipping`);
      continue;
    }
    const [project] = await db
      .insert(projectsTable)
      .values({
        key: p.key,
        name: p.name,
        description: p.description ?? null,
        ownerId: memberIds[p.ownerEmail] ?? null,
      })
      .returning();
    await db.insert(activityTable).values({
      kind: "project.created",
      message: `Project "${project!.name}" was created`,
      projectId: project!.id,
    });

    for (const s of p.stories) {
      const [story] = await db
        .insert(storiesTable)
        .values({
          projectId: project!.id,
          title: s.title,
          description: s.description ?? null,
          acceptanceCriteria: s.acceptanceCriteria ?? null,
          priority: s.priority,
          storyPoints: s.storyPoints ?? null,
          status: s.status ?? "backlog",
        })
        .returning();
      await db.insert(activityTable).values({
        kind: "story.created",
        message: `Story "${story!.title}" was added`,
        projectId: project!.id,
        storyId: story!.id,
      });

      for (const t of s.tasks) {
        const [task] = await db
          .insert(tasksTable)
          .values({
            storyId: story!.id,
            title: t.title,
            assigneeId: t.assigneeEmail
              ? memberIds[t.assigneeEmail] ?? null
              : null,
            estimateHours: t.estimateHours ?? null,
            status: t.status,
          })
          .returning();
        await db.insert(activityTable).values({
          kind: "task.created",
          message: `Task "${task!.title}" was created`,
          projectId: project!.id,
          storyId: story!.id,
          taskId: task!.id,
        });
      }
    }
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
