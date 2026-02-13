import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error("Missing env: JWT_SECRET");
}
if (!process.env.REFRESH_TOKEN_SECRET) {
  throw new Error("Missing env: REFRESH_TOKEN_SECRET");
}
if (!process.env.ACCESS_EXP) {
  throw new Error("Missing env: ACCESS_EXP");
}
if (!process.env.REFRESH_EXP) {
  throw new Error("Missing env: REFRESH_EXP");
}

// Genera access token
export async function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_EXP
  });
}

// Verifica access token
export async function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error("Token INVALIDO - Errore:", err.message);
    throw new Error("Access token invalido o scaduto");
  }
}

// Genera refresh token
export async function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_EXP
  });
}

// Verifica refresh token
export async function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    return decoded;
  } catch (err) {
    console.error("Refresh token invalido:", err.message);
    throw new Error("Refresh token invalido o scaduto");
  }
}

// Decodifica senza verificare (per debug)
export async function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}