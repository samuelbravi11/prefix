import { buildCtxFromReq } from "../utils/tenantModels.js";

/*
  GET /api/v1/notifications
  - default: tutte le notifiche dell’utente
  - ?not_read=true → solo notifiche non lette

  Nota: per ora supportiamo SOLO notifiche dirette a recipient.userId
*/
export const getUserNotifications = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const filter = { "recipient.userId": userId };
    if (req.query.not_read === "true") filter.read = false;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ message: "Errore nel recupero notifiche", error: err.message });
  }
};


/*
  PATCH /api/v1/notifications/:id/read
  Segna una notifica come letta (solo se destinata all’utente)
*/
export const markNotificationAsRead = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const { id } = req.params;

    const result = await Notification.findOneAndUpdate(
      { _id: id, "recipient.userId": userId },
      { read: true },
      { new: true }
    );

    if (!result) return res.status(404).json({ message: "Notifica non trovata" });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Errore aggiornamento notifica", error: err.message });
  }
};


/*
  PATCH /api/v1/notifications/read-all
  Segna tutte le notifiche dell’utente come lette
*/
export const markAllAsRead = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    await Notification.updateMany({ read: false, "recipient.userId": userId }, { read: true });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Errore aggiornamento notifiche", error: err.message });
  }
};