// app.js (SERVER INTERNO)
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import requestRoutes from "./routes/request.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import buildingRoutes from "./routes/building.routes.js"
import eventRoutes from "./routes/event.routes.js";
import interventionRoutes from "./routes/intervention.routes.js";
import tenantProvisionRoutes from "./routes/tenantProvision.routes.js"
// import calendarRoutes from "./routes/calendar.routes.js";

import requestLogger from "./middleware/apiLogger.middleware.js";
import rbacDecisionController from "./controllers/rbacDecision.controller.js";
import requireActiveUser from "./middleware/requireActiveUser.middleware.js";
import requireInternalProxyAndInjectUserId from "./middleware/requireInternalProxyAndInjectUserId.middleware.js";

import tenantContext from "./middleware/tenantContext.middleware.js";

const app = express();

// CORS 
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  exposedHeaders: ['set-cookie'] // Permetti al frontend di vedere i cookie
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


// BODY PARSER E COOKIE
app.use(express.json());
app.use(cookieParser());

// LOGGER
app.use(requestLogger);

// RICERCA TENANT PER SUBDOMAIN
app.use(tenantContext);

// BLOCCO ACCESSI DIRETTI + inject userId
app.use(requireInternalProxyAndInjectUserId);



/* ----------------------------------------------------------------------
   ROUTES PUBBLICHE --> accessibili solo via proxy (NO requireActiveUser)
---------------------------------------------------------------------- */
// Auth
app.use("/auth", authRoutes);

/* PDP decision
  Il rbacDecisionController verifica solo se l’utente possiede il permesso richiesto e restituisce una decisione (PERMIT o DENY).
  Tutte le richieste che richiedono autorizzazione passano prima dal proxy, dove il PEP (rbacGuard) traduce la richiesta HTTP in una permission e chiede la decisione al PDP tramite /rbac/decide.
  
  Se la decisione è PERMIT, il PEP inoltra la richiesta originale al server interno sulla route corretta.
  Se è DENY, la richiesta viene bloccata e l’API non viene mai eseguita.
*/
app.post("/rbac/decide", rbacDecisionController);

app.use("/api/v1/platform", tenantProvisionRoutes);


// HEALTH / ROOT per verifica funzionamento
app.get("/", (req, res) => {
  res.send("Server interno PDP/API attivo");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "sono vivo" });
});




/* ------------- requireActiveUser -------------
  tutto quello che segue richiede utente attivo
--------------------------------------------- */
app.use("/api/v1", requireActiveUser);

app.use((req, res, next) => {
  if (!req.user || !req.user.status || !req.user.buildingIds) {
    return res.status(500).json({
      message: "User context not initialized correctly"
    });
  }
  next();
});


/* ---------------------------------------------------
   API PROTETTE (Guard) --> accessibili solo via proxy
--------------------------------------------------- */
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/buildings", buildingRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/interventions", interventionRoutes);
//app.use("/api/v1/calendar", calendarRoutes);


export default app;