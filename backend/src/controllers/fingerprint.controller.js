import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "security_audit_trail.log");

// log audit antifrode / account / fingerprint
export async function authController(req, res, next) {
  const { email, deviceFingerprint, fingerprintHash, userId } = req.body;

  const entry = {
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType: "USER_REGISTER",

    userId: userId || null,
    email,

    success: true, // se gestisci login fallito cambi a false

    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,

    device: {
      userAgent: req.headers["user-agent"] || null,
      platform: req.headers["sec-ch-ua-platform"] || null,
      isMobile: req.headers["user-agent"]
        ? /mobile/i.test(req.headers["user-agent"])
        : null
    },

    fingerprint: {
      hash: fingerprintHash,
      metaSize: deviceFingerprint
        ? JSON.stringify(deviceFingerprint).length
        : null
    },

    // potresti aggiungere geoIP se previsto legalmente:
    geo: {
      country: null,
      city: null
    }
  };

  console.log("Nuova registrazione:", email, fingerprintHash);

  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch (err) {
    console.error("Errore salvataggio fingerprint:", err);
  }

  next();
}