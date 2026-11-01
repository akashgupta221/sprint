import express, { type Express } from "express";
import cors from "cors";
import { drainNotificationQueue } from "./lib/notificationWorker";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:4173,http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      // Same-origin/serverless calls and curl arrive without an Origin header.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serverless piggyback: drain pending notification emails after responses.
app.use((req, res, next) => {
  res.on("finish", () => {
    drainNotificationQueue();
  });
  next();
});

if (process.env.NODE_ENV === "production" && process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware());
  // Malformed/expired Clerk tokens must surface as 401 JSON, never an
  // unhandled 500 from the auth middleware.
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (!err) return next();
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        "Auth middleware error",
      );
      res.status(401).json({ error: "Unauthorized" });
    },
  );
}

app.use("/api", router);

export default app;
