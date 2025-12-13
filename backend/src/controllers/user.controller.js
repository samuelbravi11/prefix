import mongoose from "mongoose";
import User from "../models/User.js";

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    console.log("--- DEBUG START ---");

    console.log("DB Connesso (Mongoose):", mongoose.connection.name);

    const rawUsers = await mongoose.connection.db
      .collection("users")
      .find({})
      .toArray();

    console.log("RAW DRIVER RESULT (Dati Grezzi):", rawUsers);
    console.log("Numero documenti trovati (Grezzi):", rawUsers.length);

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


export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    // opzionale — qui potresti fare query db per dati aggiornati
    const user = await User.findById(req.user.id).select("-auth.passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Errore in getMe:", err);
    return res.status(500).json({ message: "Errore interno" });
  }
};