// src/stores/notification.store.js
import { defineStore } from "pinia";
import api from "@/services/api";

// notifications --> nome globale dello store
// contiene tutte le notifiche ricevute tramite REST (all’avvio) e WebSocket (in tempo reale)
export const useNotificationStore = defineStore("notifications", {
  // stato globale delle notifiche --> array di oggetti notifica inizialmente vuoto
  // si riempe all’avvio con fetchNotifications() e si aggiorna in tempo reale con addNotification()
  state: () => ({
    notifications: []
  }),

  // calcola dinamicamente le notifiche non lette --> usata nella UI per mostrare il badge campanella con il conteggio
  getters: {
    unreadCount: (state) =>
      state.notifications.filter(n => !n.read).length
  },

  actions: {
    // caricate all’avvio (REST) --> per recuperare notifiche perse mentre eri offline
    async fetchNotifications() {
      console.log("DEBUG - fetchNotifications CALLED");
      // Usa api per chiamare /api/v1/notifications
      const { data } = await api.get("/notifications");
      console.log("Notifications received:", data);
      this.notifications = data;
    },

    // chiamata dal WebSocket --> viene chiamata solo dal WS quando arriva una nuova notifica dal server, inserisce la notifica in cima e aggiorna lo stato globale
    addNotification(notification) {
      this.notifications.unshift(notification);
    },

    // segna come letta
    markAsRead(id) {
      const n = this.notifications.find(n => n._id === id);
      if (n) n.read = true;
    },

    // segna tutte come lette
    markAllAsRead() {
      this.notifications.forEach(n => (n.read = true));
    }
  }
});
