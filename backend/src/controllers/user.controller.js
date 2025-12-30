import mongoose from "mongoose";
import User from "../models/User.js";

// GET ALL USERS - Solo per scopi di debug
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

// GET ME - Dati utente autenticato
export const getMe = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    const user = await User.findById(req.user._id)
      .select("-auth.passwordHash")
      .populate("roles", "roleName");

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        roleIds: user.roles.map(r => r._id),
        roles: user.roles,
        status: user.status,
        buildingIds: user.associatedBuildingIds || [],
      },
    });
  } catch (err) {
    console.error("Errore in getMe:", err);
    return res.status(500).json({ message: "Errore interno" });
  }
};

/*
  Restituisce gli utenti con stato PENDING
  Usato da Admin Centrale per approvazione
*/
export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      status: "PENDING",
    }).lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero utenti pending",
      error: err.message,
    });
  }
};