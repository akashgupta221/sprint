import type { RequestHandler } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const requireAuth: RequestHandler = (req, res, next) => {
  // Production fails CLOSED: a missing secret must never open the API.
  if (process.env.NODE_ENV === "production" && !process.env.CLERK_SECRET_KEY) {
    res.status(500).json({ error: "Authentication is not configured" });
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    (req as unknown as { userId: string }).userId = "local-user";
    next();
    return;
  }

  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.["userId"] || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as unknown as { userId: string }).userId = String(userId);
  next();
};


/**
 * Resolve the authenticated Clerk user to a member record, creating one on
 * first login so comments/mentions/assignments are attributed properly.
 * Returns null when auth is running in local dev bypass mode.
 */
export async function resolveMember(req: {
  userId?: string;
}): Promise<{ id: number; name: string; email: string } | null> {
  if (!req.userId || req.userId === "local-user") return null;
  const user = await clerkClient.users.getUser(req.userId);
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;
  if (!email) return null;
  const name = user.fullName ?? user.username ?? email.split("@")[0];
  const [existing] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.email, email.toLowerCase()));
  if (existing) return existing;
  const [created] = await db
    .insert(membersTable)
    .values({ name, email: email.toLowerCase(), role: "member" })
    .returning();
  return created!;
}
