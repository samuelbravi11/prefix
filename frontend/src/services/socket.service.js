import { io } from "socket.io-client";
import { useNotificationStore } from "@/stores/notification.store";

let socket = null;

export function initSocket({ userId, role, buildingId }) {
  if (socket) return;

  // Il browser apre una connessione verso il server proxy (5000)
  socket = io("http://localhost:5000", {
    auth: { // Invia il token JWT per autenticazione WS (nell'handshake iniziale)
      token: localStorage.getItem("accessToken")
    }
  });

  // Invia dati di join per stanza personalizzata --> server li userà per organizzare le stanze (rooms), utilizzate per inviare notifiche mirate
  // Nota: il server verifica sempre i dati in ingresso, non fidarti mai del client
  socket.emit("join", { userId, role, buildingId });

  // Gestione evento di notifica in arrivo dal server
  // - Socket.IO riceve l’evento
  // - Il dato viene inserito nello store Pinia
  // - Tutta la UI che usa quello store si aggiorna automaticamente
  socket.on("notification", (data) => {
    const notificationStore = useNotificationStore();
    notificationStore.addNotification(data);
  });
}

// Chiude la connessione socket
export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
