import { Router, type IRouter } from "express";
import { db, membersTable } from "@workspace/db";
import {
  ListMembersResponse,
  CreateMemberBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/members", async (_req, res): Promise<void> => {
  const rows = await db.select().from(membersTable).orderBy(membersTable.name);
  res.json(ListMembersResponse.parse(rows));
});

router.post("/members", async (req, res): Promise<void> => {
  const parsed = CreateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(membersTable)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role ?? "member",
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.warn({ err }, "Failed to create member");
    res.status(400).json({ error: "Could not create member (email must be unique)" });
  }
});

export default router;
