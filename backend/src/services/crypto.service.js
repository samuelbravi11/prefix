import crypto from "crypto";

/**
 * SHA256 sync (server-side)
 * NB: diversa da crypto.subtle del browser.
 */
export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

/**
 * AES-256-GCM encrypt.
 * Restituisce stringa base64 che contiene: iv + tag + ciphertext
 */
export function aesGcmEncrypt(plainText, keyB64) {
  const key = Buffer.from(keyB64, "base64"); // 32 bytes
  if (key.length !== 32) throw new Error("TOTP_ENC_KEY must be 32 bytes base64");

  const iv = crypto.randomBytes(12); // 96-bit nonce (standard GCM)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // concateno iv|tag|ciphertext
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

/**
 * AES-256-GCM decrypt.
 */
export function aesGcmDecrypt(encB64, keyB64) {
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) throw new Error("TOTP_ENC_KEY must be 32 bytes base64");

  const data = Buffer.from(encB64, "base64");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plain.toString("utf8");
}
