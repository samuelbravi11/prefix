import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "../services/token.service.js";
import userService from "../services/user.service.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Role from "../models/Role.js";

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 giorni
  });
}

/* ---------------------------------------------------
   REGISTRAZIONE
--------------------------------------------------- */
export async function register(req, res) {
  try {
    const { name, surname, email, password, fingerprintHash } = req.body;

    if (!name || !email || !password || !fingerprintHash) {
      return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
    }

    const existing = await userService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Utente già registrato" });
    }

    const pendingRole = await Role.findOne({ roleName: "pending" });
    if (!pendingRole) {
      return res.status(500).json({ message: "Ruolo pending non configurato" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      surname,
      email,
      fingerprintHash,
      status: "pending",
      roles: [pendingRole._id],
      auth: {
        passwordHash,
        lastPasswordChangeAt: new Date(),
        refreshTokens: []
      }
    });

    await AuditLog.create({
      entityType: "AUTH",
      entityId: newUser._id,
      action: "REGISTER",
      byUser: newUser._id
    });

    return res.status(201).json({
      message: "Registrazione completata. In attesa di approvazione.",
      user: {
        id: newUser._id,
        email: newUser.email
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

    if (user.status !== "active") {
      await AuditLog.create({
        entityType: "AUTH",
        entityId: user._id,
        action: "LOGIN_DENY",
        byUser: user._id,
        details: { status: user.status }
      });

      return res.status(403).json({
        message: "Account non attivo. Contatta un amministratore."
      });
    }

    const payload = {
      userId: user._id.toString(),
      status: user.status
    };

    // USA LE FUNZIONI CORRETTE
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    await userService.addRefreshToken(user._id, refreshToken, fingerprintHash);
    setRefreshTokenCookie(res, refreshToken);

    await AuditLog.create({
      entityType: "AUTH",
      entityId: user._id,
      action: "LOGIN_SUCCESS",
      byUser: user._id
    });

    return res.json({
      message: "Login effettuato",
      accessToken,
      user: {
        id: user._id,
        email: user.email
      }
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
      payload = await verifyRefreshToken(refreshToken);
    } catch (error) {
      console.error("Errore verifica refresh token:", error);
      return res.status(401).json({ message: "Refresh token non valido o scaduto" });
    }

    const user = await User.findById(payload.userId);
    if (!user || user.status !== "active") {
      return res.status(403).json({ message: "Account non valido" });
    }

    const userId = user._id.toString();
    
    // Genera nuovo refresh token
    const newRefreshToken = await generateRefreshToken({ userId });

    // Ruota i token
    const rotated = await userService.rotateRefreshToken(
      user._id,
      refreshToken,
      newRefreshToken,
      fingerprintHash
    );

    if (!rotated) {
      return res.status(401).json({
        message: "Refresh token non valido per questo dispositivo"
      });
    }

    // Genera nuovo access token CON STATUS
    const newAccessToken = await generateAccessToken({ 
      userId,
      status: user.status  // <-- IMPORTANTE: Includi lo status
    });
    
    // Imposta il nuovo refresh token nel cookie
    setRefreshTokenCookie(res, newRefreshToken);

    await AuditLog.create({
      entityType: "AUTH",
      entityId: user._id,
      action: "REFRESH_SUCCESS",
      byUser: user._id
    });

    return res.json({ 
      accessToken: newAccessToken 
    });

  } catch (err) {
    console.error("Errore refresh token:", err);
    return res.status(500).json({ message: "Errore server refresh" });
  }
}

/* ===================================================
   LOGOUT
=================================================== */
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(200).json({ message: "Already logged out" });
    }

    // hash del refresh token
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // rimuove SOLO quel refresh token
    await User.updateOne(
      { "auth.refreshTokens.tokenHash": tokenHash },
      { $pull: { "auth.refreshTokens": { tokenHash } } }
    );

    // cancella cookie - USA LO STESSO PATH DEL LOGIN!
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

    return res.json({ message: "Logout successful" });

  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
}

/* ===================================================
   ME
=================================================== */
export const me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    const token = authHeader.split(" ")[1];
    
    // USO LA FUNZIONE CORRETTA DAL token.service.js
    const payload = await verifyAccessToken(token);
    
    // DEBUG: log del payload
    console.log("[AUTH/ME] Payload dal token:", payload);
    
    // Recupera utente dal DB
    const user = await User.findById(payload.userId)
      .select("_id name surname email roles status buildingId createdAt updatedAt")
      .populate("roles", "roleName");

    if (!user) {
      console.log("[AUTH/ME] Utente non trovato per ID:", payload.userId);
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // DEBUG: log dello status
    console.log("[AUTH/ME] Status utente dal DB:", user.status);
    console.log("[AUTH/ME] Utente completo:", user);

    // Verifica che l'utente sia attivo (usa "active" minuscolo!)
    if (user.status !== "active") {
      console.log("[AUTH/ME] Utente non attivo. Status:", user.status);
      return res.status(403).json({ 
        message: "Utente non attivo",
        status: user.status 
      });
    }

    // Restituisci i dati dell'utente
    const responseData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      roles: user.roles,
      status: user.status,
      buildingId: user.buildingId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    console.log("[AUTH/ME] Risposta:", responseData);
    return res.json(responseData);

  } catch (err) {
    console.error("Errore in /auth/me:", err);
    
    if (err.message === "Access token invalido o scaduto") {
      return res.status(401).json({ message: "Token non valido o scaduto" });
    }
    
    return res.status(500).json({ message: "Errore interno del server" });
  }
};