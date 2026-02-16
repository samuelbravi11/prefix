// src/middleware/csrfGuard.middleware.js

/**
 * CSRF Guard (double-submit cookie) con fallback SAME-ORIGIN:
 *
 * - Cross-site (Origin diverso) => richiede cookie csrfToken + header X-CSRF-Token uguali
 * - Same-origin (Origin assente o uguale a scheme://host) => richiede SOLO cookie csrfToken
 *
 * Motivo: CSRF è un attacco cross-site. Se la richiesta è same-origin, l'header non è strettamente necessario.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const CSRF_EXEMPT_PREFIXES = [
  "/auth/login/start",
  "/auth/login/verify-totp",
  "/auth/register",
  "/auth/verify-email",
  "/auth/totp/setup",
  "/auth/totp/verify",
  "/auth/bootstrap/start",
  "/api/v1/platform/tenants",
];

function isExemptPath(pathname) {
  if (!pathname) return false;
  return CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
}

function getRequestOrigin(req) {
  return req.headers.origin || null;
}

function getExpectedOrigin(req) {
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "http");
  const host = req.get("host"); // include eventuale porta
  return `${proto}://${host}`;
}

function isSameOrigin(req) {
  const origin = getRequestOrigin(req);
  if (!origin) return true;
  return origin === getExpectedOrigin(req);
}

export default function csrfGuard(req, res, next) {
  try {
    if (SAFE_METHODS.has(req.method)) return next();
    if (isExemptPath(req.originalUrl || req.url)) return next();

    const cookieToken = req.cookies?.csrfToken;
    const headerToken = req.headers["x-csrf-token"];

    // SAME-ORIGIN: basta il cookie
    if (isSameOrigin(req)) {
      if (!cookieToken) {
        return res.status(403).json({ message: "CSRF token mancante" });
      }
      return next();
    }

    // CROSS-SITE: double submit
    if (!cookieToken || !headerToken) {
      return res.status(403).json({ message: "CSRF token mancante" });
    }

    if (String(cookieToken) !== String(headerToken)) {
      return res.status(403).json({ message: "CSRF token non valido" });
    }

    return next();
  } catch {
    return res.status(403).json({ message: "CSRF check failed" });
  }
}
