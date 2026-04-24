import app from "./app";
import { logger } from "./lib/logger";
import { startNotificationWorker } from "./lib/notificationWorker";

const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  // Start the async notification worker after the HTTP listener is up.
  startNotificationWorker();
});
