// src/services/socket.service.js
import { io } from "socket.io-client";

// singleton
let socket = null;
let manuallyClosed = false;

/**
 * initSocket
 * - connette al server socket.io tramite path relativo
 * - autenticazione via cookie HttpOnly
 * - join automatico delle rooms dopo connect
 */
export function initSocket({ userId, role, buildingIds } = {}) {
  // evita doppia init
  if (socket) return socket;

  manuallyClosed = false;

  socket = io("/", {
    path: "/socket.io",
    transports: ["polling", "websocket"],
    withCredentials: true,

    // reconnessione controllata
    reconnection: true,
    reconnectionAttempts: 2,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,

    timeout: 8000,
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("[socket] connected:", socket.id);

    socket.emit("join", {
      userId,
      role,
      buildingIds,
    });
  });

  socket.on("connect_error", (err) => {
    const msg = err?.message || String(err);

    console.error("[socket] connect_error:", msg);

    // se unauthorized → stop definitivo
    if (msg.toLowerCase().includes("unauthorized")) {
      console.log("[socket] stopping reconnect (unauthorized)");
      closeSocket();
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);

    // evita reconnect dopo logout manuale
    if (manuallyClosed && socket) {
      socket.io.opts.reconnection = false;
    }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  manuallyClosed = true;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = null;
}