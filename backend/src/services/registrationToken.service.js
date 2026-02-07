import jwt from "jsonwebtoken";

/**
 * Token temporaneo (solo onboarding).
 * Serve per proteggere verify-email / totp-setup / totp-verify.
 */
export function signRegistrationToken({ userId }) {
  const secret = process.env.REGISTRATION_TOKEN_SECRET;
  if (!secret) throw new Error("Missing REGISTRATION_TOKEN_SECRET");

  const ttlMin = Number(process.env.REGISTRATION_TOKEN_TTL_MIN || 30);

  return jwt.sign(
    { userId, type: "registration" },
    secret,
    { expiresIn: `${ttlMin}m` }
  );
}

export function verifyRegistrationToken(token) {
  const secret = process.env.REGISTRATION_TOKEN_SECRET;
  if (!secret) throw new Error("Missing REGISTRATION_TOKEN_SECRET");

  const payload = jwt.verify(token, secret);

  // guard: token giusto
  if (payload?.type !== "registration") {
    throw new Error("Invalid registration token type");
  }

  return payload; // {userId, type, iat, exp}
}
