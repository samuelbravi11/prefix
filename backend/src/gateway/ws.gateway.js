import { Server } from "socket.io";
import jwt from "jsonwebtoken";

/* WEBSOCKET ... (commenti invariati) */
let io = null;

function parseCookieHeader(cookieHeader = "") {
  const out = {};
  const parts = String(cookieHeader).split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
}

const DEV_ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://test12.lvh.me:5173",
  "http://127.0.0.1",
  "http://localhost",
  "http://test12.lvh.me",
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

  io.engine.on("connection_error", (err) => {
    console.log("[engine.io] connection_error", {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  // AUTH (cookie-based)
  io.use((socket, next) => {
    const origin = socket.handshake.headers?.origin;

    // 1) Cookie HttpOnly (scelta principale)
    const cookies = parseCookieHeader(socket.handshake.headers?.cookie || "");
    const tokenFromCookie = cookies.accessToken;

    // 2) Fallback legacy: auth/query/header
    const tokenFromAuth = socket.handshake.auth?.token;
    const tokenFromQuery = socket.handshake.query?.token;
    const tokenFromHeader =
      socket.handshake.headers?.authorization?.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice("Bearer ".length)
        : socket.handshake.headers?.authorization;

    const token = tokenFromCookie || tokenFromAuth || tokenFromQuery || tokenFromHeader;

    console.log("[ws] handshake", {
      origin,
      hasCookieAuth: !!tokenFromCookie,
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
