import { generateAccessToken, generateRefreshToken } from "../services/token.service.js";
import userService from "../services/user.service.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // meglio in sviluppo
    path: "/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

/* ---------------------------------------------------
   REGISTRAZIONE
--------------------------------------------------- */
export async function register(req, res) {
  console.log("REGISTER BODY:", req.body);

  try {
    const { name, surname, email, password, role, fingerprintHash } = req.body;

    if (!name || !email || !password || !fingerprintHash) {
      return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
    }

    const existing = await userService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Utente già registrato" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      surname,
      email,
      role,
      fingerprintHash,
      auth: {
        passwordHash,
        refreshTokens: []
      }
    });

    await newUser.save();

    const payload = { userId: newUser._id, role: newUser.role };
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    await userService.addRefreshToken(newUser._id, refreshToken, fingerprintHash);

    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      message: "Registrazione completata",
      accessToken,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (err) {
    console.error("Errore registrazione:", err);
    return res.status(500).json({ message: "Errore interno" });
  }
}

/* ---------------------------------------------------
   LOGIN
--------------------------------------------------- */
export async function login(req, res) {
  try {
    const { email, password, fingerprintHash } = req.body;

    const user = await userService.verifyLogin(email, password);
    if (!user) {
      return res.status(401).json({ message: "Credenziali errate" });
    }

    const payload = { userId: user._id, role: user.role };
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    await userService.addRefreshToken(user._id, refreshToken, fingerprintHash);

    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      message: "Login effettuato",
      accessToken,
      user: { id: user._id, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error("Errore login:", err);
    return res.status(500).json({ message: "Errore server login" });
  }
}

/* ---------------------------------------------------
   REFRESH TOKEN
--------------------------------------------------- */
export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const { fingerprintHash } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token mancante" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Refresh token non valido" });
    }

    const userId = payload.userId;

    const newRefreshToken = await generateRefreshToken({
      userId,
      role: payload.role
    });

    const rotatedUser = await userService.rotateRefreshToken(
      userId,
      refreshToken,
      newRefreshToken,
      fingerprintHash
    );

    if (!rotatedUser) {
      return res.status(401).json({
        message: "Refresh token non valido per questo dispositivo"
      });
    }

    const newAccessToken = await generateAccessToken({
      userId,
      role: payload.role
    });

    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error("Errore refresh token:", err);
    return res.status(500).json({ message: "Errore server refresh" });
  }
}

/* ---------------------------------------------------
   LOGOUT
--------------------------------------------------- */
export async function logout(req, res) {
  res.clearCookie("refreshToken", { path: "/auth/refresh" });
  return res.json({ message: "Logout effettuato" });
}