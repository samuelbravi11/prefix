import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_EXP = process.env.ACCESS_EXP;
const REFRESH_EXP = process.env.REFRESH_EXP;

export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXP });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXP });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_SECRET);
}