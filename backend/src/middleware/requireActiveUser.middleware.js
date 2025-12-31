import User from "../models/User.js";
// Middleware per il controllo dello stato dell'utente
// - active: ok --> carico dati dell'utente
// - other: not ok --> utente non attivo

export default async function requireActiveUser(req, res, next) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    console.log("[requireActiveUser] req.user (prima):", req.user);

    // carico l’utente vero
    const user = await User.findById(req.user._id).lean();

    console.log("[requireActiveUser] user dal DB:", user);

    if (!user) {
      return res.status(401).json({ message: "Utente non trovato" });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Utente non attivo",
        status: user.status,
      });
    }

    // arricchisco req.user --> costruisco dati utente
    req.user = {
      _id: user._id,
      roleIds: user.roles || [],
      status: user.status,
      buildingIds: user.buildingIds || [],
    };

    console.log("[requireActiveUser] req.user (finale):", req.user);
    console.log("[requireActiveUser] buildingIds:", req.user.buildingIds);

    next();
  } catch (err) {
    console.error("[requireActiveUser] error:", err);
    res.status(500).json({ message: "Errore verifica utente" });
  }
}
