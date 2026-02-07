import { sha256 } from "./crypto.service.js";

/**
 * Genera un codice numerico semplice (6 cifre).
 * Lo invierai via email.
 */
export function generateEmailOtp() {
  const code = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return String(code);
}

/**
 * Salva hash + scadenza sul doc User.
 */
export function applyEmailOtpToUser(userDoc, otpCode) {
  const ttlMin = Number(process.env.EMAIL_OTP_TTL_MIN || 15);
  const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

  userDoc.emailOtpHash = sha256(otpCode);
  userDoc.emailOtpExpiresAt = expiresAt;

  return { expiresAt };
}

/**
 * Verifica OTP rispetto a hash e scadenza.
 */
export function verifyEmailOtp(userDoc, otpCode) {
  if (!userDoc.emailOtpHash || !userDoc.emailOtpExpiresAt) return false;
  if (new Date() > new Date(userDoc.emailOtpExpiresAt)) return false;

  return sha256(otpCode) === userDoc.emailOtpHash;
}
