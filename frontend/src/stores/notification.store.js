// src/stores/notification.store.js
import { defineStore } from "pinia";
import api from "@/services/api";

export const useNotificationStore = defineStore("notifications", {
  state: () => ({
    notifications: []
  }),

  getters: {
    // AGGIUNGI QUESTO GETTER:
    unreadNotifications: (state) =>
      state.notifications.filter(n => !n.read),
    
    unreadCount: (state) =>
      state.notifications.filter(n => !n.read).length
  },

  actions: {
    async fetchNotifications() {
      console.log("DEBUG - fetchNotifications CALLED");
      const { data } = await api.get("/notifications");
      console.log("Notifications received:", data);
      this.notifications = data;
    },

    addNotification(notification) {
      this.notifications.unshift(notification);
    },

    markAsRead(id) {
      const n = this.notifications.find(n => n._id === id);
      if (n) n.read = true;
    },

    markAllAsRead() {
      this.notifications.forEach(n => (n.read = true));
    }
  }
});