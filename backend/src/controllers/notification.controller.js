import Notification from "../models/Notification.js";
import User from "../models/User.js";
/*
  GET tutte le notifiche dell’utente
*/
export const getUserNotifications = async (req, res) => {
  try {
    console.log("=== DEBUG NOTIFICATIONS ===");
    
    // Leggi l'ID utente dall'header (dal proxy) o da req.user (se presente)
    const userId = req.headers['x-user-id'] || (req.user && req.user.id);
    
    console.log("User ID:", userId);
    console.log("Headers x-user-id:", req.headers['x-user-id']);
    console.log("req.user:", req.user);
    
    if (!userId) {
      return res.status(400).json({ message: "User ID non fornito" });
    }

    // Recupera l'utente dal database per ottenere il ruolo
    const user = await User.findById(userId).populate("roles");
    
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }
    
    const userRole = user.roles && user.roles.length > 0 ? user.roles[0].roleName : null;
    
    console.log("[NOTIFICATIONS] Fetching for user:", { userId, userRole });

    // Query di test: tutte le notifiche
    const allNotifications = await Notification.find({}).limit(10).lean();
    console.log("Tutte le notifiche nel DB:", allNotifications.length);

    // Cerca notifiche per userId O per ruolo
    const notifications = await Notification.find({
      $or: [
        { 'recipient.userId': userId },
        { 'recipient.role': userRole }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    console.log("Notifiche per utente:", notifications.length);
    
    res.json(notifications);
  } catch (err) {
    console.error("Errore fetch notifiche:", err);
    res.status(500).json({ message: "Errore recupero notifiche" });
  }
};

/*
  PATCH singola notifica letta
*/
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findByIdAndUpdate(id, {
      read: true
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Errore aggiornamento notifica" });
  }
};

/*
  PATCH tutte lette
*/
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, read: false }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Errore aggiornamento notifiche" });
  }
};
