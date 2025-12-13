// app.js (SERVER INTERNO)
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import requestRoutes from "./routes/request.routes.js";

import requestLogger from "./middleware/apiLogger.middleware.js";
import rbacDecisionController from "./controllers/rbacDecision.controller.js";
import { requireInternalProxy } from "./internalProxySecurity.js";

const app = express();

// CORS 
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));

//DEBUG MIDDLEWARE
app.use((req, res, next) => {
  console.log("\n=== INTERNAL SERVER REQUEST ===");
  console.log("Method:", req.method);
  console.log("Original URL:", req.originalUrl);
  console.log("Path:", req.path);
  console.log("Base URL:", req.baseUrl);
  console.log("Headers x-internal-proxy:", req.headers['x-internal-proxy']);
  console.log("=== END INTERNAL SERVER REQUEST ===\n");
  next();
});

// BLOCCO ACCESSI DIRETTI
app.use((req, res, next) => {
   // DEBUG
  console.log("[INTERNAL DEBUG] PATH:", req.path);
  console.log("[INTERNAL DEBUG] ORIGINAL URL:", req.originalUrl);
  console.log("[INTERNAL DEBUG] BASE URL:", req.baseUrl);
  
  // Consenti healthcheck e root (opzionale)
  if (req.path === "/" || req.path === "/health") {
    return next();
  }
  return requireInternalProxy(req, res, next);
});

// BODY PARSER E COOKIE
app.use(express.json());
app.use(cookieParser());

// LOGGER
app.use(requestLogger);


/* --------------------------------------------------
   ROUTES --> accessibili solo via proxy
-------------------------------------------------- */

// Auth
app.use("/auth", authRoutes);

// API (protette dalla Guard)
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/requests", requestRoutes);


/* PDP decision
   Il rbacDecisionController verifica solo se l’utente possiede il permesso richiesto e restituisce una decisione (PERMIT o DENY).
   Tutte le richieste che richiedono autorizzazione passano prima dal proxy, dove il PEP (rbacGuard) traduce la richiesta HTTP in una permission e chiede la decisione al PDP tramite /rbac/decide.
   
   Se la decisione è PERMIT, il PEP inoltra la richiesta originale al server interno sulla route corretta.
   Se è DENY, la richiesta viene bloccata e l’API non viene mai eseguita.
*/
app.post("/rbac/decide", rbacDecisionController);

// HEALTH / ROOT per verifica funzionamento
app.get("/", (req, res) => {
  res.send("Server interno PDP/API attivo");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "sono vivo" });
});

export default app;
