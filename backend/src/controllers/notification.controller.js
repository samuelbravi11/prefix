import mongoose from "mongoose";
import { buildCtxFromReq } from "../utils/tenantModels.js";

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function mapLegacyPriorityToSeverity(priority) {
  // legacy: low|medium|high
  if (priority === "high") return "warning";
  if (priority === "low") return "info";
  return "info";
}

function normalizeNotification(n) {
  if (!n) return n;

  // mappa legacy type -> type usato dal centro notifiche (v2)
  const legacyType = n.type;
  let type = n.type;
  if (
    [
      "REGISTRAZIONE_UTENTE",
      "ATTIVAZIONE_UTENTE",
      "REPORT_DISPONIBILE",
    ].includes(legacyType)
  ) {
    type = "system";
  } else if (
    ["PROMEMORIA_INTERVENTO", "CREAZIONE_INTERVENTO", "CANCELLAZIONE_INTERVENTO"].includes(
      legacyType
    )
  ) {
    type = "intervention";
  } else if (legacyType === "ERRORE_SERVIZIO") {
    type = "system";
  }

  // compat: se severity non c'è, prova da priority
  const severity = n.severity || mapLegacyPriorityToSeverity(n.priority);

  // compat: archived campi
  const archivedAt = n.archivedAt || (n.archived ? n.createdAt : null);

  return {
    ...n,
    legacyType,
    type,
    severity,
    archivedAt,
  };
}

/**
 * GET /api/v1/notifications
 * Query:
 * - status: all|unread|archived
 * - q: search su title/message
 * - type: filter type
 * - severity: filter severity
 * - page, limit
 *
 * Response: { items, total }
 */
export const getUserNotifications = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const status = String(req.query.status || "all");
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "").trim();
    const severity = String(req.query.severity || "").trim();

    const page = toInt(req.query.page, 1);
    const limit = Math.min(100, toInt(req.query.limit, 20));
    const skip = (page - 1) * limit;

    const filter = {
      "recipient.userId": userId,
    };

    // status
    if (status === "unread") {
      filter.read = false;
      filter.archived = { $ne: true };
    } else if (status === "archived") {
      filter.archived = true;
    }

    // legacy param (compat)
    if (req.query.not_read === "true") {
      filter.read = false;
      filter.archived = { $ne: true };
    }

    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return res.json({
      items: items.map(normalizeNotification),
      total,
    });
  } catch (err) {
    return res.status(500).json({ message: "Errore nel recupero notifiche", error: err.message });
  }
};

/**
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const count = await Notification.countDocuments({
      "recipient.userId": userId,
      read: false,
      archived: { $ne: true },
    });

    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ message: "Errore conteggio notifiche", error: err.message });
  }
};

/**
 * PATCH /api/v1/notifications/:id
 * Body: { read?: boolean, archived?: boolean }
 */
export const patchNotification = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "notificationId non valido" });
    }

    const read = req.body?.read;
    const archived = req.body?.archived;

    if (read === undefined && archived === undefined) {
      return res.status(400).json({ message: "Nessun campo da aggiornare" });
    }

    const update = {};

    if (read !== undefined) {
      const r = Boolean(read);
      update.read = r;
      update.readAt = r ? new Date() : null;
    }

    if (archived !== undefined) {
      const a = Boolean(archived);
      update.archived = a;
      update.archivedAt = a ? new Date() : null;
    }

    const doc = await Notification.findOneAndUpdate(
      { _id: id, "recipient.userId": userId },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ message: "Notifica non trovata" });

    return res.json({ ok: true, notification: normalizeNotification(doc) });
  } catch (err) {
    return res.status(500).json({ message: "Errore aggiornamento notifica", error: err.message });
  }
};

/**
 * PATCH /api/v1/notifications/:id/read  (legacy compat)
 */
export const markNotificationAsRead = async (req, res) => {
  req.body = { ...(req.body || {}), read: true };
  return patchNotification(req, res);
};

/**
 * PATCH /api/v1/notifications/read-all  (legacy compat)
 */
export const markAllAsRead = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    await Notification.updateMany(
      { read: false, archived: { $ne: true }, "recipient.userId": userId },
      { $set: { read: true, readAt: new Date() } }
    );

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Errore aggiornamento notifiche", error: err.message });
  }
};

/**
 * POST /api/v1/notifications/bulk/mark-read
 * Body: { ids: string[] }
 */
export const bulkMarkRead = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const validIds = ids.filter((x) => mongoose.isValidObjectId(x));

    if (!validIds.length) {
      return res.status(400).json({ message: "ids non validi" });
    }

    await Notification.updateMany(
      { _id: { $in: validIds }, "recipient.userId": userId },
      { $set: { read: true, readAt: new Date() } }
    );

    return res.json({ ok: true, updated: validIds.length });
  } catch (err) {
    return res.status(500).json({ message: "Errore bulk mark-read", error: err.message });
  }
};

/**
 * POST /api/v1/notifications/bulk/archive
 * Body: { ids: string[] }
 */
export const bulkArchive = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const validIds = ids.filter((x) => mongoose.isValidObjectId(x));

    if (!validIds.length) {
      return res.status(400).json({ message: "ids non validi" });
    }

    await Notification.updateMany(
      { _id: { $in: validIds }, "recipient.userId": userId },
      { $set: { archived: true, archivedAt: new Date() } }
    );

    return res.json({ ok: true, updated: validIds.length });
  } catch (err) {
    return res.status(500).json({ message: "Errore bulk archive", error: err.message });
  }
};

/**
 * DELETE /api/v1/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "notificationId non valido" });
    }

    const deleted = await Notification.findOneAndDelete({ _id: id, "recipient.userId": userId }).lean();
    if (!deleted) return res.status(404).json({ message: "Notifica non trovata" });

    return res.json({ ok: true, deleted: true });
  } catch (err) {
    return res.status(500).json({ message: "Errore eliminazione notifica", error: err.message });
  }
};

/**
 * POST /api/v1/notifications/bulk/delete
 * Body: { ids: string[] }
 */
export const bulkDelete = async (req, res) => {
  try {
    const ctx = await buildCtxFromReq(req);
    const { Notification } = ctx.models;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Non autenticato" });

    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const validIds = ids.filter((x) => mongoose.isValidObjectId(x));

    if (!validIds.length) {
      return res.status(400).json({ message: "ids non validi" });
    }

    const r = await Notification.deleteMany({ _id: { $in: validIds }, "recipient.userId": userId });
    return res.json({ ok: true, deleted: r.deletedCount || 0 });
  } catch (err) {
    return res.status(500).json({ message: "Errore bulk delete", error: err.message });
  }
};
