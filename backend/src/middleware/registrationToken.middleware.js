import { verifyRegistrationToken } from "../services/registrationToken.service.js";

/**
 * Middleware per proteggere gli step onboarding.
 * Legge Authorization: Bearer <registrationToken>
 * e salva req.registrationUserId.
 */
export function requireRegistrationToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing registration token" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyRegistrationToken(token);

    req.registrationUserId = payload.userId;
    return next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired registration token",
      error: err.message,
    });
  }
}
