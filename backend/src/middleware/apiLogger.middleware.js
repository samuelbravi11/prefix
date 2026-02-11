import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "api_calls.log");

export default async function requestLogger(req, res, next) {
  const requestId = crypto.randomUUID();
  const startTime = process.hrtime.bigint();

  // metto l'id transazione anche nella response (debug/debug UI)
  res.setHeader("X-Request-ID", requestId);

  // intercetto quando la response termina per loggare status/time
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
        role: req.user?.role || null
      },

      source: {
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        origin: req.headers.origin || null,
        referrer: req.headers.referer || null,
        userAgent: req.headers["user-agent"]
      },

      payload: {
        keys: req.body ? Object.keys(req.body) : [],
        size: req.body ? JSON.stringify(req.body).length : 0
      },

      outcome:
        res.statusCode >= 200 && res.statusCode < 300
          ? "success"
          : res.statusCode >= 400 && res.statusCode < 500
          ? "client_error"
          : "server_error"
    };

    try {
      await fs.mkdir(LOG_DIR, { recursive: true });
      await fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n");
    } catch (err) {
      console.error("Errore scrittura log API:", err);
    }
  });

  next();
}