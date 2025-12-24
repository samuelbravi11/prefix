import bcrypt from "bcrypt";
import User from "../models/User.js";
import crypto from "crypto";
import { verifyRefreshToken } from "./token.service.js";

// helper per hash token
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function verifyLogin(email, password) {
  const user = await User.findOne({ email });

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.auth.passwordHash);
  return valid ? user : null;
}

async function findByEmail(email) {
  return User.findOne({ email });
}

async function addRefreshToken(userId, refreshToken, fingerprintHash) {
  const hashed = bcrypt.hashSync(refreshToken, 10);

  return User.findByIdAndUpdate(
    userId,
    {
      $push: {
        "auth.refreshTokens": {
          tokenHash: hashed,
          fingerprintHash,
          createdAt: new Date()
        }
      }
    }
  );
}

export async function rotateRefreshToken(userId, oldToken, newToken, fingerprintHash) {
  try {
    // Verifica che il vecchio token sia valido
    const oldPayload = await verifyRefreshToken(oldToken); // <-- USA VERIFYREFRESHTOKEN
    
    if (!oldPayload || oldPayload.userId !== userId.toString()) {
      return false;
    }

    // Calcola hash
    const oldHash = crypto.createHash("sha256").update(oldToken).digest("hex");
    const newHash = crypto.createHash("sha256").update(newToken).digest("hex");

    // Aggiorna nel database
    const result = await User.updateOne(
      {
        _id: userId,
        "auth.refreshTokens.tokenHash": oldHash,
        "auth.refreshTokens.fingerprintHash": fingerprintHash,
      },
      {
        $set: { 
          "auth.refreshTokens.$.tokenHash": newHash,
          "auth.refreshTokens.$.updatedAt": new Date()
        },
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Errore nella rotazione del token:", error);
    return false;
  }
}

export default {
  //createUser,
  verifyLogin,
  findByEmail,
  addRefreshToken,
  rotateRefreshToken
};