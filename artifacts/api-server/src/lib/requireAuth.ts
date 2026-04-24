import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";

export const requireAuth: RequestHandler = (req, res, next) => {
  if (process.env.NODE_ENV !== "production" || !process.env.CLERK_SECRET_KEY) {
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
