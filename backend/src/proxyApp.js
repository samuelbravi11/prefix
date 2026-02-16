// src/proxyApp.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import requestLogger from "./middleware/apiLogger.middleware.js";
import requireAuth from "./middleware/authGuard.middleware.js";
import rbacGuard from "./middleware/rbacGuard.middleware.js";
import csrfGuard from "./middleware/csrfGuard.middleware.js";

import { emitEvent } from "./gateway/ws.gateway.js";
import { setupSwagger } from "./swagger/setupSwagger.js";

const INTERNAL_HOST = process.env.INTERNAL_HOST || "127.0.0.1";
const INTERNAL_PORT = Number(process.env.INTERNAL_PORT || 4000);

const DEV_ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://test12.lvh.me:5173",
  "http://localhost",
  "http://127.0.0.1",
  "http://test12.lvh.me",
  "http://tenantprova.lvh.me",
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (DEV_ALLOWED_ORIGINS.has(origin)) return true;

  try {
    const u = new URL(origin);
    if (u.protocol !== "http:") return false;
    if (!u.hostname.endsWith(".lvh.me")) return false;
    return u.port === "" || u.port === "5173";
  } catch {
    return false;
  }
}

function getForwardedHost(req) {
  const raw =
    req.headers["x-forwarded-host"] ||
    req.headers["x-original-host"] ||
    req.headers.host ||
    "";
  return String(raw).split(":")[0];
}

function getForwardedProto(req) {
  return String(req.headers["x-forwarded-proto"] || "http");
}

function hasJsonBody(req) {
  return (
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    req.body &&
    Object.keys(req.body).length > 0
  );
}

function pickHeaders(incoming, allowList) {
  const out = {};
  for (const k of allowList) {
    const v = incoming[k];
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

function forwardToInternal({ includeUserId = false } = {}) {
  return (req, res) => {
    const forwardedHost = getForwardedHost(req);
    const forwardedProto = getForwardedProto(req);

    const bodyPresent = hasJsonBody(req);
    const bodyString = bodyPresent ? JSON.stringify(req.body) : "";

    console.log("[PROXY] IN", {
      method: req.method,
      url: req.originalUrl,
      origin: req.headers.origin,
      host: req.headers.host,
      xfHost: req.headers["x-forwarded-host"],
      xfProto: req.headers["x-forwarded-proto"],
      forwardedHost,
      forwardedProto,
      contentType: req.headers["content-type"],
      bodyPresent,
      bodyKeys: req.body ? Object.keys(req.body) : null,
    });

    const base = pickHeaders(req.headers, [
      "accept",
      "accept-language",
      "content-type",
      "authorization",
      "cookie",
      "user-agent",
      "referer",
      "origin",
      "sec-fetch-site",
      "sec-fetch-mode",
      "sec-fetch-dest",
    ]);

    const headers = {
      ...base,
      ...(bodyPresent ? { "content-length": Buffer.byteLength(bodyString) } : {}),

      "x-internal-proxy": "true",
      "x-internal-secret": process.env.INTERNAL_PROXY_SECRET || "",

      "x-forwarded-host": forwardedHost,
      "x-forwarded-proto": forwardedProto,

      ...(includeUserId && req.user?._id ? { "x-user-id": String(req.user._id) } : {}),

      host: `${INTERNAL_HOST}:${INTERNAL_PORT}`,
      connection: "close",
    };

    const options = {
      hostname: INTERNAL_HOST,
      port: INTERNAL_PORT,
      path: req.originalUrl,
      method: req.method,
      headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      console.log("[PROXY] OUT", {
        method: req.method,
        url: req.originalUrl,
        status: proxyRes.statusCode,
      });

      const responseHeaders = { ...proxyRes.headers };

      const origin = req.headers.origin;
      if (origin && isAllowedOrigin(origin)) {
        responseHeaders["access-control-allow-origin"] = origin;
        responseHeaders["vary"] = "Origin";
        responseHeaders["access-control-allow-credentials"] = "true";
        responseHeaders["access-control-expose-headers"] = "set-cookie";
      }

      res.writeHead(proxyRes.statusCode || 500, responseHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error("[PROXY ERROR]", {
        method: req.method,
        url: req.originalUrl,
        message: err.message,
        code: err.code,
      });

      if (!res.headersSent) res.status(502).json({ message: "Bad gateway", error: err.message });
      else res.end();
    });

    if (bodyPresent) proxyReq.write(bodyString);
    proxyReq.end();
  };
}

const proxyApp = express();

proxyApp.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

proxyApp.use(express.json());
proxyApp.use(cookieParser());
proxyApp.use(requestLogger);

// IMPORTANTISSIMO: csrfGuard DOPO cookieParser
proxyApp.use(csrfGuard);

setupSwagger(proxyApp);

proxyApp.post("/internal/events", (req, res) => {
  if (req.headers["x-internal-proxy"] !== "true") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const required = process.env.INTERNAL_PROXY_SECRET;
  if (required) {
    const got = req.headers["x-internal-secret"];
    if (!got || String(got) !== String(required)) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  const { userIds, event } = req.body || {};
  if (!Array.isArray(userIds) || !event) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  for (const uid of userIds) {
    emitEvent({ userId: uid, ...event });
  }

  return res.status(204).end();
});

proxyApp.use("/auth", forwardToInternal({ includeUserId: false }));
proxyApp.use("/rbac", forwardToInternal({ includeUserId: false }));

proxyApp.post("/api/v1/platform/tenants", (req, res) => {
  const forwardedHost = getForwardedHost(req);
  const forwardedProto = getForwardedProto(req);

  const bodyPresent = hasJsonBody(req);
  const bodyString = bodyPresent ? JSON.stringify(req.body) : "";

  const headers = {
    "content-type": req.headers["content-type"] || "application/json",
    ...(bodyPresent ? { "content-length": Buffer.byteLength(bodyString) } : {}),

    "x-internal-proxy": "true",
    "x-internal-secret": process.env.INTERNAL_PROXY_SECRET || "",
    ...(req.headers["x-platform-seed-key"]
      ? { "x-platform-seed-key": req.headers["x-platform-seed-key"] }
      : {}),

    "x-forwarded-host": forwardedHost,
    "x-forwarded-proto": forwardedProto,

    host: `${INTERNAL_HOST}:${INTERNAL_PORT}`,
    connection: "close",
  };

  const options = {
    hostname: INTERNAL_HOST,
    port: INTERNAL_PORT,
    path: req.originalUrl,
    method: "POST",
    headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const responseHeaders = { ...proxyRes.headers };

    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
      responseHeaders["access-control-allow-origin"] = origin;
      responseHeaders["vary"] = "Origin";
      responseHeaders["access-control-allow-credentials"] = "true";
      responseHeaders["access-control-expose-headers"] = "set-cookie";
    }

    res.writeHead(proxyRes.statusCode || 500, responseHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("[TENANT PROXY ERROR]", err);
    res.status(500).json({ message: "Proxy error", error: err.message });
  });

  if (bodyPresent) proxyReq.write(bodyString);
  proxyReq.end();
});

proxyApp.use("/api/v1/users", requireAuth, rbacGuard, forwardToInternal({ includeUserId: true }));
proxyApp.use("/api/v1/dashboard", requireAuth, rbacGuard, forwardToInternal({ includeUserId: true }));
proxyApp.use("/api/v1/requests", requireAuth, rbacGuard, forwardToInternal({ includeUserId: true }));
proxyApp.use("/api/v1/notifications", requireAuth, rbacGuard, forwardToInternal({ includeUserId: true }));
proxyApp.use("/api/v1/buildings", requireAuth, rbacGuard, forwardToInternal({ includeUserId: true }));
proxyApp.use("/api/v1/events", requireAuth, rbacGuard, forwardToInternal({ includeUserId: true }));
proxyApp.use("/api/v1/interventions", requireAuth, rbacGuard, forwardToInternal({ includeUserId: true }));
proxyApp.use("/api/v1/calendar", requireAuth, rbacGuard, forwardToInternal({ includeUserId: true }));

proxyApp.get("/health", (req, res) => {
  res.json({
    status: "Proxy server is running",
    timestamp: new Date().toISOString(),
    internal: `${INTERNAL_HOST}:${INTERNAL_PORT}`,
  });
});

proxyApp.use((req, res) => {
  console.log("[PROXY 404]", req.method, req.originalUrl);
  res.status(404).json({ message: "Route non trovata nel proxy", path: req.originalUrl });
});

proxyApp.use((err, req, res, next) => {
  console.error("[PROXY ERROR HANDLER]", err);
  res.status(500).json({
    message: "Errore interno del proxy",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default proxyApp;


/* PROXY (Guard / API Gateway)
  http-proxy-middleware è utilizzato per implementare un reverse proxy applicativo
  all’interno di Express.

  createProxyMiddleware(...) crea un middleware che:
  - intercetta la richiesta HTTP in ingresso
  - la inoltra a un server di destinazione (target)
  - restituisce al client la risposta del server interno

  In questo progetto il proxy funge da Guard (PEP) e rappresenta
  l’unico punto di accesso alle API.

  --------------------------------------------------
  target: "http://127.0.0.1:4000"
  --------------------------------------------------
  Indica il server interno (API + PDP):

  - NON è esposto al browser
  - è accessibile solo dal proxy
  - riceve le richieste già autenticate e autorizzate

  Esempi di inoltro:
    /api/v1/dashboard  → http://127.0.0.1:4000/api/v1/dashboard
    /rbac/decide       → http://127.0.0.1:4000/rbac/decide

  --------------------------------------------------
  changeOrigin: false
  --------------------------------------------------
  Mantiene l’header Host originale.
  L’identificazione della richiesta come “interna” avviene tramite
  un header dedicato, non tramite l’Host.

  --------------------------------------------------
  onProxyReq: withInternalProxyHeader
  --------------------------------------------------
  Aggiunge automaticamente l’header:

    x-internal-proxy: true

  a TUTTE le richieste inoltrate al server interno.

  Questo header rappresenta il “sigillo di fiducia”:
  - il server interno rifiuta le richieste che ne sono prive
  - impedisce accessi diretti o bypass del proxy

  --------------------------------------------------
  Nota su /rbac
  --------------------------------------------------
  La route /rbac è gestita dal proxy per inoltrare le richieste
  di decisione al PDP.

  - NON è una route per il frontend
  - serve solo al proxy (rbacGuard → PDP)
  - /rbac/decide viene usata esclusivamente per decidere (PERMIT / DENY)

  Le API di business NON passano da /rbac/decide:
  il controllo avviene prima, nel proxy, tramite rbacGuard.
*/