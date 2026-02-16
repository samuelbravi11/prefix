import crypto from "crypto";

/**
 * Protegge endpoint di piattaforma (es. creazione tenant).
 * Richiede header: x-platform-seed-key: <key>
 */
export function requirePlatformKey(req, res, next) {
  const serverKey = process.env.PLATFORM_SEED_KEY;
  if (!serverKey) {
    return res.status(500).json({ message: "Server misconfigured: PLATFORM_SEED_KEY missing" });
  }

  const provided = String(req.headers["x-platform-seed-key"] || "");
  if (!provided) {
    return res.status(401).json({ message: "Missing platform key" });
  }

  // constant-time compare
  const a = Buffer.from(provided);
  const b = Buffer.from(serverKey);

  if (a.length !== b.length) {
    return res.status(403).json({ message: "Invalid platform key" });
  }

  const ok = crypto.timingSafeEqual(a, b);
  if (!ok) {
    return res.status(403).json({ message: "Invalid platform key" });
  }

  return next();
}
