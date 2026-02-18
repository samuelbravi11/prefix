import Notification from "../models/Notification.js";
// User non serve importarlo se non lo usi direttamente per query, ma lo lascio se servisse in futuro
import User from "../models/User.js"; 

/*
  HELPER: Recupera ID e Ruolo in modo sicuro
  Funziona sia in produzione (req.user popolato da JWT)
  sia nei test (x-user-id nell'header)
*/
const getAuthData = (req) => {
  const userId = req.user?._id || req.headers['x-user-id'];
  // Il ruolo potrebbe non esserci nell'header durante i test, gestiamo il caso
  const userRole = req.user?.role || req.headers['x-user-role']; 
  return { userId, userRole };
};

/*
  GET /api/v1/notifications
  - default: tutte le notifiche dell’utente
  - ?not_read=true → solo notifiche non lette
*/
export const getUserNotifications = async (req, res) => {
  try {
    const { userId, userRole } = getAuthData(req);

    if (!userId) {
      return res.status(401).json({ message: "Utente non identificato" });
    }

    // Costruiamo il filtro OR dinamicamente
    const ownershipFilter = [
      { "recipient.userId": userId }
    ];

    // Aggiungiamo il filtro per ruolo solo se il ruolo esiste
    if (userRole) {
      ownershipFilter.push({ "recipient.role": userRole });
    }

    const filter = {
      $or: ownershipFilter
    };

    // Opzionale: solo non lette
    if (req.query.not_read === "true") {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(notifications);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero notifiche",
      error: err.message
    });
  }
};

/*
  PATCH /api/v1/notifications/:id/read
  Segna una notifica come letta (SOLO se appartiene all'utente)
*/
export const markNotificationAsRead = async (req, res) => {
  try {
    const { userId, userRole } = getAuthData(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Utente non identificato" });
    }

    const ownershipFilter = [
      { "recipient.userId": userId }
    ];
    if (userRole) {
      ownershipFilter.push({ "recipient.role": userRole });
    }

    const result = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: ownershipFilter // <--- IL FIX: Verifica la proprietà qui!
      },
      { read: true },
      { new: true }
    );

    if (!result) {
      // Se non la trova, potrebbe non esistere O non essere tua.
      // In entrambi i casi 404 è sicuro.
      return res.status(404).json({ message: "Notifica non trovata" });
    }

    res.json({ success: true, notification: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore aggiornamento notifica" });
  }
};

/*
  PATCH /api/v1/notifications/read-all
  Segna tutte le notifiche dell’utente come lette
*/
export const markAllAsRead = async (req, res) => {
  try {
    const { userId, userRole } = getAuthData(req);

    if (!userId) {
      return res.status(401).json({ message: "Utente non identificato" });
    }

    const ownershipFilter = [
      { "recipient.userId": userId }
    ];
    if (userRole) {
      ownershipFilter.push({ "recipient.role": userRole });
    }

    await Notification.updateMany(
      {
        read: false,
        $or: ownershipFilter // <--- IL FIX: Filtra solo le TUE notifiche
      },
      { read: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Errore aggiornamento notifiche" });
  }
};