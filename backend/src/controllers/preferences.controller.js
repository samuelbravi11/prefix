import { getTenantModels } from "../utils/tenantModels.js";

function isPlainObject(x) {
  return x && typeof x === "object" && !Array.isArray(x);
}

function safeJsonSize(obj, maxBytes = 32_000) {
  try {
    const s = JSON.stringify(obj ?? {});
    return Buffer.byteLength(s, "utf8") <= maxBytes;
  } catch {
    return false;
  }
}

/**
 * GET /api/v1/preferences/me
 */
export async function getMyPreferences(req, res) {
  try {
    const { User } = getTenantModels(req);
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const user = await User.findById(userId).select("preferences wantsNotifications").lean();
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    // compat: wantsNotifications riflette notifications.enabled (se presente)
    const prefs = isPlainObject(user.preferences) ? user.preferences : {};
    return res.json({ ...prefs, wantsNotifications: Boolean(user.wantsNotifications) });
  } catch (err) {
    return res.status(500).json({ message: "Errore recupero preferenze", error: err.message });
  }
}

/**
 * PUT /api/v1/preferences/me
 * Body: oggetto preferenze (schema libero, size limit)
 */
export async function updateMyPreferences(req, res) {
  try {
    const { User } = getTenantModels(req);
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const payload = req.body;
    if (!isPlainObject(payload)) {
      return res.status(400).json({ message: "Payload preferenze non valido" });
    }

    if (!safeJsonSize(payload, 32_000)) {
      return res.status(413).json({ message: "Preferenze troppo grandi" });
    }

    // se il frontend manda notifications.enabled, riflettilo su wantsNotifications
    let wantsNotifications = undefined;
    if (isPlainObject(payload.notifications) && typeof payload.notifications.enabled === "boolean") {
      wantsNotifications = payload.notifications.enabled;
    }

    const update = { $set: { preferences: payload } };
    if (wantsNotifications !== undefined) {
      update.$set.wantsNotifications = Boolean(wantsNotifications);
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true })
      .select("preferences wantsNotifications")
      .lean();

    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    const prefs = isPlainObject(user.preferences) ? user.preferences : {};
    return res.json({ ...prefs, wantsNotifications: Boolean(user.wantsNotifications) });
  } catch (err) {
    return res.status(500).json({ message: "Errore salvataggio preferenze", error: err.message });
  }
}
