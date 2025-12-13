import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "auth_audit.log");

/**
 * Security Audit Middleware
 * Registra eventi di autenticazione (login, register, refresh)
 */
export default function authAudit(eventType) {
  return async function (req, res, next) {
    try {
      const entry = {
        eventId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        eventType,

        // Identità (se disponibile)
        email: req.body?.email || null,
        userId: req.user?.id || null,

        // Esito (default: successo, override nel controller se serve)
        success: true,

        // Network
        ip:
          req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress ||
          null,

        // Device
        device: {
          userAgent: req.headers["user-agent"] || null,
          platform: req.headers["sec-ch-ua-platform"] || null,
          isMobile: req.headers["user-agent"]
            ? /mobile/i.test(req.headers["user-agent"])
            : null
        },

        // Fingerprint (se presente)
        fingerprint: req.body?.fingerprintHash || null
      };

      await fs.mkdir(LOG_DIR, { recursive: true });
      await fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n");

    } catch (err) {
      // audit NON deve mai bloccare il flusso
      console.error("Auth audit error:", err);
    }

    next();
  };
}