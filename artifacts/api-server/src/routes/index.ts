import { Router, type IRouter } from "express";
import healthRouter from "./health";
import membersRouter from "./members";
import projectsRouter from "./projects";
import storiesRouter from "./stories";
import tasksRouter from "./tasks";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import docsRouter from "./docs";
import { requireAuth } from "../lib/requireAuth";

const router: IRouter = Router();

// Public — health probe and Swagger UI must remain reachable without auth.
router.use(healthRouter);
router.use(docsRouter);

// Everything below requires a signed-in Clerk session.
router.use(requireAuth);
router.use(membersRouter);
router.use(projectsRouter);
router.use(storiesRouter);
router.use(tasksRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);

export default router;
