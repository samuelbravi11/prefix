import { generateAccessToken, generateRefreshToken } from "../services/token.service.js";
import userService from "../services/user.service.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";


function setRefreshTokenCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}


export async function register(req, res) {
  console.log("REGISTER BODY:", req.body);
  try {
    const { name, surname, email, password, role, fingerprintHash } = req.body;

    if (!name || !email || !password || !fingerprintHash) {
      return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
    }

    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Utente già esistente" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      surname,
      email,
      role,
      fingerprintHash,
      //deviceFingerprint: JSON.stringify(deviceFingerprint),
      auth: {
        passwordHash,
        refreshTokens: [],
      },
    });

    await newUser.save();

    // CREAZIONE TOKEN JWT
    const payload = { userId: newUser._id, role: newUser.role };
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    // salva refresh token hashato legato a fingerprint
    await userService.addRefreshToken(newUser._id, refreshToken, fingerprintHash);

    // set cookie httpOnly
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
  } catch (error) {
    console.error("Errore registrazione:", error);
    res.status(500).json({ message: "Errore interno" });
  }
}

/*
export async function register(req, res) {
  try {
    const { email, password, name, deviceFingerprint, fingerprintHash } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e password obbligatorie" });
    }

    const existing = await userService.findByEmail(email);
    console.log("DEBUG findByEmail:", existing);
    if (existing) {
      return res.status(400).json({ message: "Email già registrata" });
    }

    console.log("CONTROLLER: sto creando utente", email)
    // SALVATAGGIO UTENTE valido per tua validation mongo
    const newUser = await userService.createUser({
      email,
      password,
      name,
      fingerprintHash,
      deviceFingerprint: JSON.stringify(deviceFingerprint)
    });

    // CREAZIONE TOKEN JWT
    const payload = { userId: newUser._id, role: newUser.role };
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    // salva refresh token hashato legato a fingerprint
    await userService.addRefreshToken(newUser._id, refreshToken, fingerprintHash);

    // set cookie httpOnly
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

  } catch (error) {
    console.error("Errore registrazione:", error);
    return res.status(500).json({ message: "Errore server registrazione" });
  }
}
*/
export async function login(req, res) {
  //console.log("LOGIN BODY:", req.body);
  try {
    const { email, password, fingerprintHash } = req.body;

    const user = await userService.verifyLogin(email, password);

    if (!user) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const payload = { userId: user._id, role: user.role };

    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    // salviamo il refresh token legato a questo device
    await userService.addRefreshToken(user._id, refreshToken, fingerprintHash);

    // settiamo cookie httpOnly+secure
    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      message: "Login effettuato",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Errore login:", error);
    return res.status(500).json({ message: "Errore server login" });
  }
}

// il browser manda automaticamente il cookie con il refresh token
// questo grazie a [withCredentials: true] nel frontend
export async function refresh(req, res) {
  try {
    const { fingerprintHash } = req.body;
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token mancante" });
    }

    // verifica firma JWT del refresh token
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Refresh token non valido" });
    }

    const userId = payload.userId;

    // rotazione solo se fingerprint combacia
    const newRefreshTokenPayload = { userId, role: payload.role };
    const newRefreshToken = await generateRefreshToken(newRefreshTokenPayload);

    const rotatedUser = await userService.rotateRefreshToken(
      userId,
      refreshToken,
      newRefreshToken,
      fingerprintHash
    );

    if (!rotatedUser) {
      // token non trovato o fingerprint diverso → possibile token rubato
      return res.status(401).json({ message: "Refresh token non valido per questo dispositivo" });
    }

    // genera nuovo access token
    const newAccessToken = await generateAccessToken({
      userId,
      role: payload.role
    });

    // aggiorna cookie col nuovo refresh token
    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error("Errore refresh token:", error);
    return res.status(500).json({ message: "Errore server refresh" });
  }
}



// Logout non invalida token perché backend non li conserva.
// lato client devi solo cancellare i token salvati
export async function logout(req, res) {
  res.clearCookie("refreshToken", { path: "/auth/refresh" });
  return res.json({ message: "Logout effettuato (token cancellato lato client)" });
}
