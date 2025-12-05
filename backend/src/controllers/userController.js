import mongoose from "mongoose";
import User from "../models/Users.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../services/token.service.js";
import { comparePassword } from "../services/auth.service.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Se lo usi altrove, lo lascio

// ================= GET ALL USERS =================
export const getAllUsers = async (req, res) => {
  try {
    console.log("--- DEBUG START ---");

    // 1. DB connesso
    console.log("DB Connesso (Mongoose):", mongoose.connection.name);

    // 2. Lettura nativa driver
    const rawUsers = await mongoose.connection.db
      .collection("users")
      .find({})
      .toArray();

    console.log("RAW DRIVER RESULT (Dati Grezzi):", rawUsers);
    console.log("Numero documenti trovati (Grezzi):", rawUsers.length);

    // 3. Mongoose query
    const mongooseUsers = await User.find();
    console.log("Mongoose Schema RESULT:", mongooseUsers);

    console.log("--- DEBUG END ---");

    res.status(200).json({
      dbName: mongoose.connection.name,
      rawCount: rawUsers.length,
      mongooseCount: mongooseUsers.length,
      data: mongooseUsers,
    });
  } catch (error) {
    console.error("Errore critico:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e password richieste" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Credenziali errate" });
    }

    const valid = await comparePassword(password, user.auth.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Credenziali errate" });
    }

    const payload = { id: user._id, email: user.email, role: user.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.auth.refreshTokens.push({ tokenHash: refreshTokenHash });
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Errore login:", error);
    res.status(500).json({ message: "Errore interno" });
  }
};

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { name, surname, email, password, role, securityNumber } = req.body;

    if (!name || !surname || !email || !password || !role || !securityNumber) {
      return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Utente già esistente" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      surname,
      email,
      role,
      securityNumber,
      auth: {
        passwordHash,
        refreshTokens: [],
      },
    });

    await newUser.save();

    res.status(201).json({ message: "Utente registrato con successo" });
  } catch (error) {
    console.error("Errore registrazione:", error);
    res.status(500).json({ message: "Errore interno" });
  }
};