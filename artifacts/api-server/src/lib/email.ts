import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

let cachedTransport: Transporter | null = null;
let cachedMode: "smtp" | "log" | null = null;

/**
 * Returns a nodemailer Transporter.
 *
 * If SMTP_HOST is configured, a real SMTP transport is used. Otherwise we use
 * the JSON transport which serializes the message instead of sending it. This
 * allows the async pipeline (queue -> worker -> outbox status) to work end-to-
 * end in any environment, while still demonstrating real delivery when an SMTP
 * server is configured.
 */
export function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST;
  if (host) {
    const port = Number(process.env.SMTP_PORT ?? "587");
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    cachedTransport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
    cachedMode = "smtp";
    logger.info({ host, port, secure }, "Email transport: SMTP");
  } else {
    // Dev fallback: serialize the message into JSON so the worker still gets
    // a successful response object. This makes the async pipeline observable
    // without external infrastructure.
    cachedTransport = nodemailer.createTransport({ jsonTransport: true });
    cachedMode = "log";
    logger.info(
      "Email transport: log/JSON (set SMTP_HOST to enable real email delivery)",
    );
  }
  return cachedTransport;
}

export function getEmailMode(): "smtp" | "log" {
  if (!cachedMode) getTransport();
  return cachedMode ?? "log";
}

export function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "Sprint <no-reply@sprint.local>";
}
