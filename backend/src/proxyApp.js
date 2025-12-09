// proxyApp.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import requireAuth from "./middleware/requireAuth.js";
import requestLogger from "./middleware/requestLogger.js";
import rbacGuard from "./middleware/rbacGuard.js"; // esiste già
import { createProxyMiddleware } from "http-proxy-middleware";

/*
    http-proxy-middleware è un pacchetto Node.js utilizzato per la gestione dei proxy nelle applicazioni costruite con framework come Express
    Semplifica il processo di instradamento delle richieste da un client verso un server di destinazione differente

    createProxyMiddleware: agisce come un "intermediario".
    Invece di gestire direttamente la richiesta nel tuo server locale,
    il middleware la inoltra all'URL di destinazione (il target specificato nella configurazione),
    e poi restituisce la risposta del server di destinazione al client originale.
*/

const proxyApp = express();

proxyApp.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

proxyApp.use(express.json());
proxyApp.use(cookieParser());

// Log di ogni richiesta che arriva dalla rete esterna
proxyApp.use(requestLogger);

// URL del server interno (API + PDP)
const INTERNAL_SERVER = "http://127.0.0.1:4000";

/* -----------------------------------------------------
   ROUTE PUBBLICHE – NON richiedono token
   /auth/login
   /auth/register
   /auth/refresh
------------------------------------------------------ */
proxyApp.use(
  "/auth",
  createProxyMiddleware({
    target: INTERNAL_SERVER,
    changeOrigin: false
  })
);

/* -----------------------------------------------------
   ROUTE PRIVATE – richiedono token + RBAC
   /api/v1/*
------------------------------------------------------ */
proxyApp.use(
  "/api/v1",
  requireAuth,  // middleware di autenticazione
  rbacGuard,     // RBAC middleware (chiama PDP)
  createProxyMiddleware({
    target: INTERNAL_SERVER,
    changeOrigin: false
  })
);

/* -----------------------------------------------------
   CATCH-ALL (inoltra tutto il resto)
------------------------------------------------------ */
proxyApp.use(
  "/",
  createProxyMiddleware({
    target: INTERNAL_SERVER,
    changeOrigin: false
  })
);

export default proxyApp;