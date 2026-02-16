// src/middleware/requireRegistrationToken.middleware.js
import { verifyRegistrationToken } from "../services/registrationToken.service.js";

/**
 * Middleware per proteggere gli step onboarding.
 * Legge Authorization: Bearer <registrationToken>
 * e salva req.registrationUserId.
 */
export function requireRegistrationToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing registration token" });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyRegistrationToken(token);

    req.registrationUserId = String(payload.userId);
    req.registrationTenantId = payload.tenantId ? String(payload.tenantId) : null;

    if (req.tenant?.tenantId && req.registrationTenantId && req.registrationTenantId !== String(req.tenant.tenantId)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }
    return next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired registration token",
      error: err.message,
    });
  }
}
