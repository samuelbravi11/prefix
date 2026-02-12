// src/middleware/apiLogger.middleware.js
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "..", "logs");

// Configurazione logger Winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(LOG_DIR, "api_calls-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

export default async function requestLogger(req, res, next) {
  const requestId = crypto.randomUUID();
  const startTime = process.hrtime.bigint();

  res.setHeader("X-Request-ID", requestId);

  res.on("finish", async () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;

    const entry = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      user: {
        id: req.user?._id || null,
        role: req.user?.role || null,
      },
      source: {
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        origin: req.headers.origin || null,
        referrer: req.headers.referer || null,
        userAgent: req.headers["user-agent"],
      },
      payload: {
        keys: req.body ? Object.keys(req.body) : [],
        size: req.body ? JSON.stringify(req.body).length : 0,
      },
      outcome:
        res.statusCode >= 200 && res.statusCode < 300
          ? "success"
          : res.statusCode >= 400 && res.statusCode < 500
          ? "client_error"
          : "server_error",
    };

    logger.info(entry);
  });

  next();
}