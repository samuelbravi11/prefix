// src/services/notifications.service.js
import api from "@/services/api";

/**
 * Notification model consigliato:
 * {
 *  _id,
 *  createdAt,
 *  readAt: Date|null,
 *  archivedAt: Date|null,
 *  type: "building_request" | "rule_triggered" | "ai_alert" | ...,
 *  severity: "info"|"success"|"warning"|"error",
 *  title,
 *  message,
 *  data: { ... },          // payload libero
 *  entity: { type, id, name }, // collegamento entità
 *  action: { label, route },   // CTA opzionale
 * }
 */

export const notificationsService = {
  async list(params = {}) {
    // params: { status, q, type, severity, page, limit }
    const res = await api.get("/notifications", { params });
    return res.data;
  },

  async unreadCount() {
    const res = await api.get("/notifications/unread-count");
    return res.data;
  },

  async markRead(id, read = true) {
    const res = await api.patch(`/notifications/${id}`, { read });
    return res.data;
  },

  async archive(id, archived = true) {
    const res = await api.patch(`/notifications/${id}`, { archived });
    return res.data;
  },

  async bulkMarkRead(ids = []) {
    const res = await api.post("/notifications/bulk/mark-read", { ids });
    return res.data;
  },

  async bulkArchive(ids = []) {
    const res = await api.post("/notifications/bulk/archive", { ids });
    return res.data;
  },

  async remove(id) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },

  async bulkRemove(ids = []) {
    const res = await api.post("/notifications/bulk/delete", { ids });
    return res.data;
  },
};
