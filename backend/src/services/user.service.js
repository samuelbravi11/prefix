// src/services/user.service.js
import bcrypt from "bcrypt";
import { sha256 } from "./crypto.service.js";
import { verifyRefreshToken } from "./token.service.js";

// Verifica che il pepper sia presente (viene validato all'avvio del server)
if (!process.env.REFRESH_TOKEN_PEPPER) {
  throw new Error("Missing env: REFRESH_TOKEN_PEPPER");
}
const REFRESH_PEPPER = process.env.REFRESH_TOKEN_PEPPER;

function hashToken(token) {
  return sha256(String(token) + REFRESH_PEPPER);
}

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

export async function findByEmail(UserModel, email) {
  return UserModel.findOne({ email: normalizeEmail(email) });
}

export async function verifyLogin(UserModel, email, password) {
  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.auth.passwordHash);
  return valid ? user : null;
}

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
        },
      },
    },
    { new: true }
  );
}

export async function rotateRefreshToken(UserModel, userId, oldToken, newToken, fingerprintHash) {
  try {
    const oldPayload = await verifyRefreshToken(oldToken);
    if (!oldPayload || oldPayload.userId !== userId.toString()) return false;

    const oldHash = hashToken(oldToken);
    const newHash = hashToken(newToken);

    const result = await UserModel.updateOne(
      {
        _id: userId,
        "auth.refreshTokens.tokenHash": oldHash,
        "auth.refreshTokens.fingerprintHash": fingerprintHash,
      },
      {
        $set: {
          "auth.refreshTokens.$.tokenHash": newHash,
        },
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Errore nella rotazione del token:", error);
    return false;
  }
}

export async function revokeRefreshTokenForDevice(UserModel, refreshToken, fingerprintHash) {
  const tokenHash = hashToken(refreshToken);
  const result = await UserModel.updateOne(
    { "auth.refreshTokens.tokenHash": tokenHash },
    { $pull: { "auth.refreshTokens": { tokenHash, fingerprintHash } } }
  );
  return result.modifiedCount > 0;
}

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