// src/proxy/proxyApp.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import requestLogger from "./middleware/apiLogger.middleware.js";
import requireAuth from "./middleware/authGuard.middleware.js";
import rbacGuard from "./middleware/rbacGuard.middleware.js";

import { emitEvent } from "./gateway/ws.gateway.js";
import { setupSwagger } from "./swagger/setupSwagger.js";


const proxyApp = express();

/*
// DEBUG middleware per vedere tutte le richieste in arrivo
proxyApp.use("/api", (req, res, next) => {
  console.log("MATCH /api GENERICO", req.originalUrl);
  next();
});
*/

/* CORS
  intercetta TUTTE le richieste OPTIONS --> risponde subito, senza passare da: requireAuth, rbacGuard e altri middleware
  questo perché OPTIONS non è una richiesta dell’utente, è una richiesta tecnica del browser (necessaria per fare le chiamate API)
  se l'OPTIONS passa da requireAuth --> il server non permette al browser la richiesta e si ferma in preflight
  La preflight request è sostanzialmente la richiesta verso il server per chiedergli: “Sei d’accordo che io faccia un POST con questi header?” (cors)
*/
proxyApp.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// BODY PARSER
proxyApp.use(express.json());
proxyApp.use(cookieParser());

// LOGGER
proxyApp.use(requestLogger);


/* =====================================================
  SWAGGER UI – DOCUMENTAZIONE PUBBLICA
  ======================================================
  - accessibile a chiunque
  - NON passa da auth
  - NON passa da RBAC
  - solo lettura documentazione
*/
setupSwagger(proxyApp);


/* ROUTE PER GESTIRE LE NOTIFICHE
  Il proxy:
  - riceve la notifica dal server interno (notification.service.js)
  - non conosce il dominio dell'evento, si limita a inoltrarlo
  - emette l'evento WS verso i client connessi in base a userId/role/buildingId (rooms)
*/
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

  // payload atteso:
  // { userIds: string[], event: {...} }
  const { userIds, event } = req.body || {};
  if (!Array.isArray(userIds) || !event) {
    return res.status(400).json({ message: "Invalid payload", expected: { userIds: [], event: {} } });
  }

  // fan-out verso room user:<id>
  for (const uid of userIds) {
    emitEvent({ userId: uid, ...event });
  }

  return res.status(204).end();
});


/* =====================================================
   FUNZIONE DI PROXY MANUALE
===================================================== */
// Si occupa di inoltrare la richiesta al server interno usando http.request e settando manualmente l'header x-internal-proxy
const manualProxy = (req, res) => {
  console.log(`[MANUAL PROXY] Inoltrando richiesta: ${req.method} ${req.originalUrl}`);

  const originalHost =
    req.headers["x-forwarded-host"] ||
    req.headers["x-original-host"] ||
    req.headers.host;

  const options = {
    hostname: '127.0.0.1',
    port: 4000,
    path: req.originalUrl,
    method: req.method,
    headers: {
      ...req.headers,
      // sigillo di fiducia
      'x-internal-proxy': 'true',
      // chiave
      "x-internal-secret": process.env.INTERNAL_PROXY_SECRET || "",
      // proxy passa solo id user --> sarà il server interno connesso al DB a ricostruirsi l'utente e verificare se è attivo
      'x-user-id': req.user?._id?.toString?.() || '',
      // host originale da cui arriva la risposta --> per subdomain multi-tenant
      'x-forwarded-host': originalHost,
      'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'http',
      host: '127.0.0.1:4000',
      connection: 'close',
    }
  };
  
  console.log(`[MANUAL PROXY] Opzioni: ${JSON.stringify({
    method: options.method,
    path: options.path,
    headers: {
      'x-internal-proxy': options.headers['x-internal-proxy'],
      'authorization': options.headers['authorization'] ? 'presente' : 'assente'
    }
  }, null, 2)}`);
  
  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`[MANUAL PROXY] Risposta dal server interno: ${proxyRes.statusCode} ${req.originalUrl}`);
    
    // Inoltra gli header della risposta
    const responseHeaders = { ...proxyRes.headers };
    
    // Assicurati che CORS sia gestito correttamente
    responseHeaders['access-control-allow-origin'] = 'http://localhost:5173';
    responseHeaders['access-control-allow-credentials'] = 'true';
    
    res.writeHead(proxyRes.statusCode, responseHeaders);
    
    // Pipe della risposta al client
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('[MANUAL PROXY ERROR]', err);
    res.status(500).json({ 
      message: 'Proxy error',
      error: err.message 
    });
  });
  
  // Se c'è un body, invialo
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyString = JSON.stringify(req.body);
    proxyReq.write(bodyString);
    console.log(`[MANUAL PROXY] Inviando body (${bodyString.length} bytes)`);
  }
  
  proxyReq.end();
};

/* BUGFIX
  Inoltravo la richiesta da proxy a server e si cancellava la prima parte della route auth (esempio: proxy (/auth/login) --> server (/login)).
  Per questo motivo (solo per la parte di API pubbliche) ho configurato manualmente il proxy.
  
  Il problema era dovuto al fatto che, nelle route pubbliche (/auth), il proxy era implementato manualmente usando http.request e costruiva il path della richiesta usando req.path,
  che in Express non contiene il prefisso della route montata (/auth viene “consumato” da app.use("/auth", ...));
  di conseguenza la richiesta /auth/login veniva inoltrata al server interno come /login.
  Nelle route private il problema non si presentava perché veniva usato http-proxy-middleware,
  che inoltra correttamente l’URL completo (req.originalUrl) e gestisce automaticamente il path rewriting.
*/ // MANUAL PROXY PER /auth
/* =====================================================
   PUBLIC ROUTES - AUTH
===================================================== */
proxyApp.use("/auth", (req, res) => {
  console.log("[MANUAL PROXY /auth] Inoltrando richiesta:", req.method, req.path);
  
  const fullPath = req.baseUrl + (req.path === '/' ? '' : req.path);
  
  const originalHost =
    req.headers["x-forwarded-host"] ||
    req.headers["x-original-host"] ||
    req.headers.host;

  const options = {
    hostname: '127.0.0.1',
    port: 4000,
    path: fullPath,
    method: req.method,
    headers: {
      ...req.headers,
      'x-internal-proxy': 'true',
      "x-internal-secret": process.env.INTERNAL_PROXY_SECRET || "",
      'x-forwarded-host': originalHost,
      'host': '127.0.0.1:4000'
    }
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('[MANUAL PROXY /auth ERROR]', err);
    res.status(500).json({ 
      message: 'Proxy error',
      error: err.message 
    });
  });
  
  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.end();
});


/* =====================================================
   PDP (RBAC DECISION ENDPOINT) --> USATO SOLO DAL PROXY
===================================================== */
// Faccio passare tutte le chiamate ad un unico endpoint.
// Questo perché al PDP interessa solo:
// - user.ID --> da cui preleva il ruolo e i permessi
// - permission --> permesso dell'azione originale (da confrontare con i permessi utente)
proxyApp.use("/rbac", (req, res) => {
  console.log("[MANUAL PROXY /rbac] Inoltrando richiesta:", req.method, req.path);
  
  const fullPath = req.baseUrl + (req.path === '/' ? '' : req.path);
  
  const originalHost =
    req.headers["x-forwarded-host"] ||
    req.headers["x-original-host"] ||
    req.headers.host;

  const options = {
    hostname: '127.0.0.1',
    port: 4000,
    path: fullPath,
    method: req.method,
    headers: {
      ...req.headers,
      'x-internal-proxy': 'true',
      "x-internal-secret": process.env.INTERNAL_PROXY_SECRET || "",
      'x-forwarded-host': originalHost,
      'host': '127.0.0.1:4000'
    }
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`[MANUAL PROXY /rbac] Risposta: ${proxyRes.statusCode}`);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('[MANUAL PROXY /rbac ERROR]', err);
    res.status(500).json({ 
      message: 'Proxy error',
      error: err.message 
    });
  });
  
  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.end();
});



/* =====================================================
  API PROTETTE – /api/v1/** --> GUARDA IN FONDO
===================================================== */
// Tutte le rotte API protette passano da qui
// Questo perché il proxy deve applicare la guardia RBAC prima di inoltrare la richiesta al server interno
// Inoltre faccio passare tutte le richieste API per il proxy manuale (manualProxy) per avere un controllo completo sugli header e sul flusso di richiesta/risposta

// API per users
proxyApp.use("/api/v1/users", requireAuth, rbacGuard, manualProxy);

// API per dashboard
proxyApp.use("/api/v1/dashboard", requireAuth, rbacGuard, manualProxy);

// API per requests
proxyApp.use("/api/v1/requests", requireAuth, rbacGuard, manualProxy);

// API per notifications
proxyApp.use("/api/v1/notifications", requireAuth, rbacGuard, manualProxy);

// API per buildings
proxyApp.use("/api/v1/buildings", requireAuth, rbacGuard, manualProxy);

// API per events
proxyApp.use("/api/v1/events", requireAuth, rbacGuard, manualProxy);

// API per interventions
proxyApp.use("/api/v1/interventions", requireAuth, rbacGuard, manualProxy);

// API per calendar
proxyApp.use("/api/v1/calendar", requireAuth, rbacGuard, manualProxy);

// API per tenant
proxyApp.use("/api/v1/platform", requireAuth, rbacGuard, manualProxy);


// Route di test
proxyApp.get("/health", (req, res) => {
  res.json({ 
    status: "Proxy server is running",
    timestamp: new Date().toISOString()
  });
});

// Gestione errori 404
proxyApp.use((req, res) => {
  console.log("[PROXY 404] Route non trovata:", req.method, req.originalUrl);
  res.status(404).json({ 
    message: "Route non trovata nel proxy",
    path: req.originalUrl
  });
});

// Error handling middleware
proxyApp.use((err, req, res, next) => {
  console.error("[PROXY ERROR]", err);
  res.status(500).json({ 
    message: "Errore interno del proxy",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
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