import Notification from "../models/Notification.js";
import User from "../models/User.js";

/*
  GET /api/v1/notifications

  - default: tutte le notifiche dell’utente
  - ?not_read=true → solo notifiche non lette

  Le notifiche sono visibili se:
  - destinate direttamente all’utente
  - oppure destinate al ruolo dell’utente
*/
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // filtro base: destinatario user o ruolo
    const filter = {
      $or: [
        { "recipient.userId": userId },
        { "recipient.role": userRole }
      ]
    };

    // opzionale: solo non lette
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
  Segna una notifica come letta
*/
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const result = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { "recipient.userId": userId },
          { "recipient.role": req.user.role }
        ]
      },
      { read: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Notifica non trovata" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Errore aggiornamento notifica" });
  }
};

/*
  PATCH /api/v1/notifications/read-all
  Segna tutte le notifiche dell’utente come lette
*/
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    await Notification.updateMany(
      {
        read: false,
        $or: [
          { "recipient.userId": userId },
          { "recipient.role": userRole }
        ]
      },
      { read: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Errore aggiornamento notifiche" });
  }
};
