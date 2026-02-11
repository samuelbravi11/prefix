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
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = payload; // deve contenere userId
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
    socket.on("join", ({ userId }) => {
      // NON fidarti del client
      if (!userId) return;
      if (String(socket.user.userId || socket.user.id) !== String(userId)) return;

      socket.join(`user:${userId}`);
    });
  });
}

/* ============================
  EMISSIONE EVENTI
============================ */
// Funzione per emettere eventi verso client specifici
// Senza gateway non potresti emettere eventi WS dal backend --> ogni servizio rischia di creare una nuova istanza di Socket.IO, aprendo nuove connessioni WS ad ogni richiesta HTTP
// Con il gateway hai un'unica istanza di Socket.IO che mantiene le connessioni WS aperte
export function emitEvent(event) {
  if (!io) return;
  if (event.userId) io.to(`user:${event.userId}`).emit("notification", event);
}
