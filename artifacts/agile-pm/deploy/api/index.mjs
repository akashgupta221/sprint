// Vercel serverless entry: Express app handles all /api/* routes.
import app from "./app.mjs";

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  return app(req, res);
}
