import { computed } from "vue";
import { useNotificationStore } from "@/stores/notification.store";

/* COMPOSABLE PER NOTIFICHE
  I composable non gestiscono il ciclo di vita né il fetching dei dati:
  incapsulano e riutilizzano logica reattiva sopra allo stato globale.
  Questo significa avere uno stato derivato (computed) e azioni (funzioni) per interagire con lo store.
  Stato derivato significa che il composable espone proprietà calcolate basate sullo stato globale (store).
  Azioni significa che il composable espone funzioni che permettono di modificare lo stato globale (store).
*/
export function useNotification() {
  const store = useNotificationStore();

  return {
    // stato derivato
    notifications: computed(() => store.notifications),
    unreadCount: computed(() => store.unreadCount),

    // azioni
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
  };
}