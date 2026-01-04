// src/composables/useNotification.js
import { computed } from "vue";
import { useNotificationStore } from "@/stores/notification.store";

export function useNotification() {
  const store = useNotificationStore();

  return {
    // MODIFICA QUI: cambia store.notifications in store.unreadNotifications
    notifications: computed(() => store.unreadNotifications),
    unreadCount: computed(() => store.unreadCount),

    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
  };
}