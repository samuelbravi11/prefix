import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import requestLogger from "./middleware/apiLogger.middleware.js";
import cookieParser from "cookie-parser";

import requestLogger from "./middleware/requestLogger.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

import rbacDecisionController from "./controllers/rbacDecision.controller.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

/* -----------------------------------------------------
  Public Routes (login, register, refresh, ecc.)
------------------------------------------------------ */
app.use("/auth", authRoutes);

/* -----------------------------------------------------
  Protected API (la Guard assicura auth + rbac)
------------------------------------------------------ */
app.use("/api/v1", userRoutes);

/* -----------------------------------------------------
  INTERNAL RBAC DECISION ENDPOINT
  Usato SOLO dalla Guard (proxy)
------------------------------------------------------ */
app.post("/rbac/decide", rbacDecisionController);

/* -----------------------------------------------------
  Default route
------------------------------------------------------ */
app.use("/", (req, res) => {
  res.send("Server interno PDP/API attivo");
});

export default app;