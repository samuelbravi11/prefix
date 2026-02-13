import crypto from "crypto";
import qrcode from "qrcode";
import { authenticator } from "@otplib/preset-default";
import { sha256, aesGcmEncrypt, aesGcmDecrypt } from "./crypto.service.js";

/**
 * Genera secret TOTP + otpauth URL.
 * issuer = nome app, label = email utente.
 */
export function generateTotpSecret({ email, issuer }) {
  const secret = authenticator.generateSecret(); // stringa base32 (otplib)
  const label = `${issuer}:${email}`;

  const otpauth_url = authenticator.keyuri(email, issuer, secret);

  return {
    base32: secret,
    otpauth_url,
    label,
    issuer,
  };
}

/**
 * Salva il secret nel DB cifrato (AES-GCM).
 * NB: salviamo a riposo cifrato, non in chiaro.
 */
export function applyTotpSecretToUser(userDoc, secretBase32) {
  const keyB64 = process.env.TOTP_ENC_KEY;
  if (!keyB64) throw new Error("Missing TOTP_ENC_KEY");

  userDoc.totpSecretEnc = aesGcmEncrypt(secretBase32, keyB64);
  userDoc.totpEnabled = false; // verrà true solo dopo verify
}

/**
 * Genera QR code dataURL lato server.
 */
export async function buildQrCodeDataUrl(otpauthUrl) {
  // data URL: "data:image/png;base64,..."
  return qrcode.toDataURL(otpauthUrl);
}

/**
 * Crea token a vita breve per legare setup->verify.
 * - Token random in chiaro viene inviato al client
 * - Nel DB salvo solo hash + scadenza
 */
export function createAndApplyTotpSetupToken(userDoc) {
  const ttlMin = Number(process.env.TOTP_SETUP_TOKEN_TTL_MIN || 10);
  const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

  const token = crypto.randomBytes(32).toString("hex"); // 64 chars
  userDoc.totpSetupTokenHash = sha256(token);
  userDoc.totpSetupTokenExpiresAt = expiresAt;

  return { token, expiresAt };
}

/**
 * Verifica token breve (setupToken).
 */
export function verifyTotpSetupToken(userDoc, setupTokenPlain) {
  if (!userDoc.totpSetupTokenHash || !userDoc.totpSetupTokenExpiresAt) return false;
  if (new Date() > new Date(userDoc.totpSetupTokenExpiresAt)) return false;
  return sha256(setupTokenPlain) === userDoc.totpSetupTokenHash;
}

/**
 * Verifica codice TOTP (6 cifre).
 * - Decripta secret
 * - usa otplib verify
 */
export function verifyTotpCode(userDoc, code) {
  if (!userDoc.totpSecretEnc) return false;

  const keyB64 = process.env.TOTP_ENC_KEY;
  if (!keyB64) throw new Error("Missing TOTP_ENC_KEY");

  const secretBase32 = aesGcmDecrypt(userDoc.totpSecretEnc, keyB64);

  // window: 1 -> tollera un “passo” di clock skew (30s)
  return authenticator.check(String(code), secretBase32);
}
