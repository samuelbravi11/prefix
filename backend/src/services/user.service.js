import bcrypt from "bcrypt";
import User from "../models/User.js";
import crypto from "crypto";

// helper per hash token
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/*
// CREAZIONE utente
export async function createUser({
  email,
  password,
  name,
  fingerprintHash,
  deviceFingerprint
}) {

  const passwordHash = await bcrypt.hash(password, 10);
 
  // crea utente mongoose
  const user = new User({
    email,
    name: name || null, // Aggiunto fallback a null per name e fingerprintHash
    fingerprintHash: fingerprintHash || null,
    deviceFingerprint: typeof deviceFingerprint === 'object' ? JSON.stringify(deviceFingerprint) : deviceFingerprint,
    auth: {
      passwordHash,
      refreshTokens: []
    }
  });

  console.log("Salvataggio utente nel DB:", user);
  const saved = await user.save();
  console.log("User creato:", saved);
  return saved;
}
*/

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

async function rotateRefreshToken(userId, oldToken, newToken, fingerprintHash) {
  const oldHash = bcrypt.hashSync(oldToken, 10);
  const newHash = bcrypt.hashSync(newToken, 10);

  return User.findOneAndUpdate(
    {
      _id: userId,
      "auth.refreshTokens.tokenHash": oldHash,
      "auth.refreshTokens.fingerprintHash": fingerprintHash
    },
    { $set: { "auth.refreshTokens.$.tokenHash": newHash } }
  );
}

export default {
  //createUser,
  verifyLogin,
  findByEmail,
  addRefreshToken,
  rotateRefreshToken
};