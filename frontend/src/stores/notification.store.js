// src/stores/notification.store.js
import { defineStore } from "pinia";
import { notificationsService } from "@/services/notifications.service";

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}

export const useNotificationStore = defineStore("notificationStore", {
  state: () => ({
    items: [],
    total: 0,
    unreadCount: 0,

    loading: false,
    loadingCount: false,
    error: null,

    // query state
    query: {
      status: "all", // all|unread|archived
      q: "",
      type: "",
      severity: "",
      page: 1,
      limit: 20,
    },

    // realtime polling
    pollingTimer: null,
    pollingSeconds: 20,
  }),

  getters: {
    hasUnread: (s) => s.unreadCount > 0,
  },

  actions: {
    setQuery(patch) {
      this.query = { ...this.query, ...patch };
    },

    async fetchList() {
      this.loading = true;
      this.error = null;
      try {
        const data = await notificationsService.list(this.query);

        // supporta sia formato {items,total} sia array semplice
        if (Array.isArray(data)) {
          this.items = data;
          this.total = data.length;
        } else {
          this.items = safeArr(data.items);
          this.total = Number(data.total || this.items.length);
        }
      } catch (e) {
        this.error = e?.response?.data?.message || "Impossibile caricare le notifiche";
        this.items = [];
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },

    async fetchUnreadCount() {
      this.loadingCount = true;
      try {
        const data = await notificationsService.unreadCount();
        this.unreadCount = Number(data?.count ?? data ?? 0);
      } catch {
        // non blocchiamo la UI
      } finally {
        this.loadingCount = false;
      }
    },

    async markRead(id, read = true) {
      await notificationsService.markRead(id, read);
      // update locale
      const idx = this.items.findIndex((x) => x._id === id);
      if (idx >= 0) {
        this.items[idx] = { ...this.items[idx], readAt: read ? new Date().toISOString() : null };
      }
      await this.fetchUnreadCount();
    },

    async archive(id, archived = true) {
      await notificationsService.archive(id, archived);
      const idx = this.items.findIndex((x) => x._id === id);
      if (idx >= 0) {
        this.items[idx] = { ...this.items[idx], archivedAt: archived ? new Date().toISOString() : null };
      }
      await this.fetchUnreadCount();
    },

    async remove(id) {
      await notificationsService.remove(id);
      this.items = this.items.filter((x) => x._id !== id);
      this.total = Math.max(0, this.total - 1);
      await this.fetchUnreadCount();
    },

    async bulkMarkRead(ids = []) {
      if (!ids.length) return;
      await notificationsService.bulkMarkRead(ids);
      const now = new Date().toISOString();
      this.items = this.items.map((x) => (ids.includes(x._id) ? { ...x, readAt: now } : x));
      await this.fetchUnreadCount();
    },

    async bulkArchive(ids = []) {
      if (!ids.length) return;
      await notificationsService.bulkArchive(ids);
      const now = new Date().toISOString();
      this.items = this.items.map((x) => (ids.includes(x._id) ? { ...x, archivedAt: now } : x));
      await this.fetchUnreadCount();
    },

    async bulkRemove(ids = []) {
      if (!ids.length) return;
      await notificationsService.bulkRemove(ids);
      this.items = this.items.filter((x) => !ids.includes(x._id));
      this.total = this.items.length;
      await this.fetchUnreadCount();
    },

    startPolling(seconds = 20) {
      this.stopPolling();
      this.pollingSeconds = Math.max(5, Number(seconds || 20));

      this.pollingTimer = setInterval(async () => {
        // aggiorna count sempre, lista solo se sei in pagina notifiche (ci penserà la view)
        await this.fetchUnreadCount();
      }, this.pollingSeconds * 1000);
    },

    stopPolling() {
      if (this.pollingTimer) clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    },
  },
});
