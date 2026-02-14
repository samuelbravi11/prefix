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

const DEV_ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://test12.lvh.me:5173",
]);

function isAllowedWsOrigin(origin) {
  if (!origin) return true; // curl / tools / same-origin
  if (DEV_ALLOWED_ORIGINS.has(origin)) return true;

  // allow http://<sub>.lvh.me:5173
  try {
    const u = new URL(origin);
    return (
      u.protocol === "http:" &&
      u.hostname.endsWith(".lvh.me") &&
      u.port === "5173"
    );
  } catch {
    return false;
  }
}

export function initWebSocket(server) {
  io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: (origin, cb) => {
        if (isAllowedWsOrigin(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
  });

  /* ============================
     LOG ERRORI ENGINE.IO (LOW LEVEL)
     QUESTO VA SUBITO DOPO new Server(...)
  ============================ */
  io.engine.on("connection_error", (err) => {
    console.log("[engine.io] connection_error", {
      code: err.code,
      message: err.message,
      context: err.context,
    });
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
    const origin = socket.handshake.headers?.origin;

    // token può arrivare in modi diversi a seconda del client / proxy
    const tokenFromAuth  = socket.handshake.auth?.token;
    const tokenFromQuery = socket.handshake.query?.token;
    const tokenFromHeader =
      socket.handshake.headers?.authorization?.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice("Bearer ".length)
        : socket.handshake.headers?.authorization;

    const token = tokenFromAuth || tokenFromQuery || tokenFromHeader;

    console.log("[ws] handshake", {
      origin,
      hasAuthToken: !!tokenFromAuth,
      hasQueryToken: !!tokenFromQuery,
      hasHeaderAuth: !!socket.handshake.headers?.authorization,
      host: socket.handshake.headers?.host,
    });

    if (!token) {
      console.log("[ws] rejected: missing token");
      return next(new Error("Unauthorized: missing token"));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      console.log("[ws] authenticated user:", payload.userId || payload.id);
      next();
    } catch (err) {
      console.log("[ws] rejected: invalid token", err.message);
      return next(new Error("Unauthorized: invalid token"));
    }
  });



  /* ============================
     CONNECTION HANDLER
  ============================ */
  io.on("connection", (socket) => {

    console.log("[ws] CONNECTED", {
      userId: socket.user?.userId || socket.user?.id,
      socketId: socket.id,
    });

    socket.on("join", ({ userId, role, buildingIds }) => {

      console.log("[ws] join request", { userId, role, buildingIds });

      if (!userId) return;

      if (String(socket.user.userId || socket.user.id) !== String(userId)) {
        console.log("[ws] join rejected: user mismatch");
        return;
      }

      socket.join(`user:${userId}`);

      if (role) socket.join(`role:${role}`);

      if (Array.isArray(buildingIds)) {
        buildingIds.forEach((bid) => socket.join(`building:${bid}`));
      }

      console.log("[ws] joined rooms", socket.rooms);
    });

    socket.on("disconnect", (reason) => {
      console.log("[ws] DISCONNECTED", {
        socketId: socket.id,
        reason,
      });
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