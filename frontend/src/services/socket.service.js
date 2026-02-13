// src/services/socket.service.js
import { io } from "socket.io-client";

// Mantieni singleton
let socket = null;

/**
 * initSocket
 * - connette al server socket.io tramite Vite proxy (path relativo)
 * - autentica via JWT (handshake.auth.token)
 * - join rooms dopo connect
 */
export function initSocket({ token, userId, role, buildingIds } = {}) {
  if (!token) {
    console.warn("[socket] initSocket skipped: missing token");
    return null;
  }

  // già connesso/inizializzato
  if (socket) return socket;

  socket = io("/", {
    path: "/socket.io",
    transports: ["polling", "websocket"],
    auth: { token },
    withCredentials: true, // ok, anche se JWT; non rompe
    reconnection: true,
    reconnectionAttempts: 5,      // evita loop infinito
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 8000,
  });

  socket.on("connect", () => {
    // join rooms (il server controlla userId vs token)
    socket.emit("join", { userId, role, buildingIds });
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] connect_error:", err?.message || err);
  });

  socket.on("disconnect", (reason) => {
    // utile per debug
    // console.log("[socket] disconnected:", reason);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
}
