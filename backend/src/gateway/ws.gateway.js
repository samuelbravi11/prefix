import { Server } from "socket.io";
import jwt from "jsonwebtoken";

/* WEBSOCKET
  Una WebSocket è una connessione persistente tra client e server.
  Una volta aperta:
  - il server può inviare dati quando vuole
  - il client non deve chiedere nulla
*/
/* SOCKET.IO
  Socket.IO è una libreria che semplifica l'uso delle WebSocket.
  Offre funzionalità aggiuntive come:
  - gestione automatica delle riconnessioni
  - heartbeat/ping-pong gestito
  - stanze (rooms) per organizzare i client
  - eventi con nomi (notification, eventCreated, ecc.)
*/
/* GATEWAY
  Il Gateway è il punto centrale che:
  - inizializza la parte realtime (Socket.IO) una sola volta mantendo le connessioni aperte
  - autentica i client usando JWT durante la connessione
  - mantiene un riferimento globale (io) per inviare eventi dal backend ai client connessi
  - organizza i client in stanze (rooms) basate su userId, ruolo, edificio
  - permette di emettere eventi verso utenti specifici, ruoli o edifici
*/
let io = null;

export function initWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: false, // usi JWT, non cookie
    },
  });

  /* ============================
     AUTH MIDDLEWARE (WS)
  ============================ */
  // Middleware di autenticazione per ogni connessione WS
  // viene eseguito PRIMA del "connection" handler
  // Se il token non è valido, la connessione viene rifiutata
  // Se il token è valido, il payload JWT viene salvato in socket.user, da quel momento tutta la connessione WS è autenticata
  // Per fare questo dobbiamo aprire la socket solo DOPO l'autenticazione da parte del client che si salverà l'access token su localStorage e lo invierà qui
  // TODO: gestire access token su httpOnly cookie per evitare attacchi XSS (injection codice javascript nel browser per leggere localStorage)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized: missing token"));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload; // deve contenere userId, ruolo, buildings?
      next();
    } catch {
      return next(new Error("Unauthorized: invalid token"));
    }
  });


  /* ============================
  CONNECTION HANDLER
  ============================ */
  // viene chiamato ogni volta che un browser si connette (vedi file frontend/src/services/socket.service.js)
  // ti dà un oggetto socket che rappresenta quel client
  io.on("connection", (socket) => {
    // L'utente si iscrive alle stanze che gli competono
    socket.on("join", ({ userId, role, buildingIds }) => {
      if (!userId) return;
      if (String(socket.user.userId || socket.user.id) !== String(userId)) return;

      socket.join(`user:${userId}`);
      if (role) socket.join(`role:${role}`);
      if (Array.isArray(buildingIds)) {
        buildingIds.forEach((bid) => socket.join(`building:${bid}`));
      }
    });
  });
}

/* ============================
  EMISSIONE EVENTI
============================ */
/**
 * Emette un evento a uno o più destinatari.
 * Supporta:
 * - userId: singolo utente
 * - userIds: array di utenti
 * - role: tutti gli utenti con quel ruolo (stanza role:<role>)
 * - buildingId: tutti gli utenti associati a quell'edificio (stanza building:<buildingId>)
 */
export function emitEvent({ userId, userIds, role, buildingId, ...event }) {
  if (!io) return;

  if (userId) {
    io.to(`user:${userId}`).emit("notification", event);
  }
  if (userIds && Array.isArray(userIds)) {
    userIds.forEach((uid) => io.to(`user:${uid}`).emit("notification", event));
  }
  if (role) {
    io.to(`role:${role}`).emit("notification", event);
  }
  if (buildingId) {
    io.to(`building:${buildingId}`).emit("notification", event);
  }
}