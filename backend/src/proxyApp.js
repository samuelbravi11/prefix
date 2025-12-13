import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import http from "http";

import requestLogger from "./middleware/apiLogger.middleware.js";
import requireAuth from "./middleware/authGuard.middleware.js";
import rbacGuard from "./middleware/rbacGuard.middleware.js";
import { withInternalProxyHeader } from "./internalProxySecurity.js";
import requireActiveUser from "./middleware/requireActiveUser.middleware.js";


const proxyApp = express();

// DEBUG middleware per vedere tutte le richieste in arrivo
proxyApp.use((req, res, next) => {
  console.log("\n=== PROXY REQUEST INFO ===");
  console.log("Method:", req.method);
  console.log("Original URL:", req.originalUrl);
  console.log("Base URL:", req.baseUrl);
  console.log("Path:", req.path);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("=== END PROXY REQUEST INFO ===\n");
  next();
});

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


/* BUGFIX
  Inoltravo la richiesta da proxy a server e si cancellava la prima parte della route auth (esempio: proxy (/auth/login) --> server (/login)).
  Per questo motivo (solo per la parte di API pubbliche) ho configurato manualmente il proxy.
  
  Il problema era dovuto al fatto che, nelle route pubbliche (/auth), il proxy era implementato manualmente usando http.request e costruiva il path della richiesta usando req.path,
  che in Express non contiene il prefisso della route montata (/auth viene “consumato” da app.use("/auth", ...));
  di conseguenza la richiesta /auth/login veniva inoltrata al server interno come /login.
  Nelle route private il problema non si presentava perché veniva usato http-proxy-middleware,
  che inoltra correttamente l’URL completo (req.originalUrl) e gestisce automaticamente il path rewriting.
*/ // MANUAL PROXY PER /auth
proxyApp.use("/auth", (req, res) => {
  console.log("[MANUAL PROXY /auth] Inoltrando richiesta");
  
  // RICOSTRUIAMO l'URL completo per il server interno
  const fullPath = req.baseUrl + (req.path === '/' ? '' : req.path);
  console.log("[MANUAL PROXY /auth] Full path ricostruito:", fullPath);
  
  const options = {
    hostname: '127.0.0.1',
    port: 4000,
    path: fullPath,
    method: req.method,
    headers: {
      ...req.headers,
      'x-internal-proxy': 'true',
      'host': '127.0.0.1:4000'
    }
  };
  
  console.log("[MANUAL PROXY /auth] Opzioni di connessione:", JSON.stringify(options, null, 2));
  
  const proxyReq = http.request(options, (proxyRes) => {
    console.log("[MANUAL PROXY /auth] Risposta dal server interno:", proxyRes.statusCode);
    
    // Inoltra gli header della risposta
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    // Pipe della risposta al client
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('[MANUAL PROXY /auth ERROR]', err);
    res.status(500).json({ 
      message: 'Proxy error',
      error: err.message 
    });
  });
  
  // Se c'è un body, invialo
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("[MANUAL PROXY /auth] Inviando body:", JSON.stringify(req.body));
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.end();
});

// PROXY PER LE ALTRE ROTTE (guarda in fondo)
const internalProxy = createProxyMiddleware({
  target: "http://127.0.0.1:4000",
  changeOrigin: false,
  onProxyReq: withInternalProxyHeader
});

/* NON FUNZIONA NON SO PERCHE' BUGFIX RISOLTO VEDI SOPRA STO IMPAZZENDO
/ =====================================================
   PUBLIC ROUTES
===================================================== /
proxyApp.use(
  "/auth",
  internalProxy
);
*/

/* =====================================================
   PROTECTED ROUTES
===================================================== */
proxyApp.use(
  "/api/v1/users",
  requireAuth,
  requireActiveUser,
  rbacGuard,
  internalProxy
);

proxyApp.use(
  "/api/v1/dashboard",
  requireAuth,
  requireActiveUser,
  rbacGuard,
  internalProxy
);

proxyApp.use(
  "/api/v1/requests",
  requireAuth,
  requireActiveUser,
  rbacGuard,
  internalProxy
);

// PDP --> RBAC decision endpoint (USATO SOLO DAL PROXY)
// Faccio passare tutte le chiamate ad un unico endpoint
// --> questo perché al PDP interessa solo:
// - user.ID --> da cui preleva il ruolo e i permessi
// - permission --> permesso dell'azione originale (da confrontare con i permessi utente)
proxyApp.use(
  "/rbac",
  internalProxy
);

// Route di test
proxyApp.get("/health", (req, res) => {
  res.json({ status: "Proxy server is running" });
});

// Gestione errori 404
proxyApp.use((req, res) => {
  console.log("[PROXY 404] Route non trovata:", req.method, req.originalUrl);
  res.status(404).json({ message: "Route non trovata nel proxy" });
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