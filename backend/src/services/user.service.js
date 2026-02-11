import bcrypt from "bcrypt";
import { sha256 } from "./crypto.service.js";
import { verifyRefreshToken } from "./token.service.js";

/**
 * Hash refresh token con pepper (sicurezza extra)
 */
function hashToken(token) {
  const pepper = process.env.REFRESH_TOKEN_PEPPER || "";
  return sha256(String(token) + pepper);
}

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

/**
 * Trova utente per email (tenant-aware).
 * @param {mongoose.Model} UserModel
 * @param {string} email
 */
export async function findByEmail(UserModel, email) {
  return UserModel.findOne({ email: normalizeEmail(email) });
}

/**
 * Verifica login (tenant-aware).
 * @param {mongoose.Model} UserModel
 * @param {string} email
 * @param {string} password
 */
export async function verifyLogin(UserModel, email, password) {
  const normalizedEmail = normalizeEmail(email);

  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.auth.passwordHash);
  return valid ? user : null;
}

/**
 * Aggiunge refresh token (tenant-aware) legato al device.
 * Salva SOLO hash sha256 del token.
 *
 * @param {mongoose.Model} UserModel
 * @param {string|ObjectId} userId
 * @param {string} refreshToken
 * @param {string} fingerprintHash
 */
export async function addRefreshToken(UserModel, userId, refreshToken, fingerprintHash) {
  const tokenHash = hashToken(refreshToken);

  return UserModel.findByIdAndUpdate(
    userId,
    {
      $push: {
        "auth.refreshTokens": {
          tokenHash,
          fingerprintHash,
          createdAt: new Date(),
          // updatedAt: new Date(), // <-- SOLO se aggiungi updatedAt nello schema
        },
      },
    },
    { new: true }
  );
}

/**
 * Ruota refresh token (tenant-aware):
 * - verifica firma del vecchio refresh token
 * - controlla che appartenga a userId
 * - sostituisce oldHash con newHash SOLO se fingerprint coincide
 *
 * @param {mongoose.Model} UserModel
 * @param {string|ObjectId} userId
 * @param {string} oldToken
 * @param {string} newToken
 * @param {string} fingerprintHash
 */
export async function rotateRefreshToken(UserModel, userId, oldToken, newToken, fingerprintHash) {
  try {
    const oldPayload = await verifyRefreshToken(oldToken);
    if (!oldPayload || oldPayload.userId !== userId.toString()) {
      return false;
    }

    const oldHash = hashToken(oldToken);
    const newHash = hashToken(newToken);

    const update = {
      $set: {
        "auth.refreshTokens.$.tokenHash": newHash,
        // "auth.refreshTokens.$.updatedAt": new Date(), // <-- SOLO se aggiungi updatedAt nello schema
      },
    };

    const result = await UserModel.updateOne(
      {
        _id: userId,
        "auth.refreshTokens.tokenHash": oldHash,
        "auth.refreshTokens.fingerprintHash": fingerprintHash,
      },
      update
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Errore nella rotazione del token:", error);
    return false;
  }
}

/**
 * Revoca un refresh token specifico (logout singolo device)
 * @param {mongoose.Model} UserModel
 * @param {string} refreshToken
 * @param {string} fingerprintHash
 */
export async function revokeRefreshTokenForDevice(UserModel, refreshToken, fingerprintHash) {
  const tokenHash = hashToken(refreshToken);

  const result = await UserModel.updateOne(
    { "auth.refreshTokens.tokenHash": tokenHash },
    { $pull: { "auth.refreshTokens": { tokenHash, fingerprintHash } } }
  );

  return result.modifiedCount > 0;
}

/**
 * Revoca un refresh token ovunque (fallback, meno “preciso”)
 * @param {mongoose.Model} UserModel
 * @param {string} refreshToken
 */
export async function revokeRefreshToken(UserModel, refreshToken) {
  const tokenHash = hashToken(refreshToken);

  const result = await UserModel.updateOne(
    { "auth.refreshTokens.tokenHash": tokenHash },
    { $pull: { "auth.refreshTokens": { tokenHash } } }
  );

  return result.modifiedCount > 0;
}

export default {
  findByEmail,
  verifyLogin,
  addRefreshToken,
  rotateRefreshToken,
  revokeRefreshTokenForDevice,
  revokeRefreshToken,
};
