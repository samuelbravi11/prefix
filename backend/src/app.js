import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import requestLogger from "./middleware/apiLogger.middleware.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Middleware di logging per tutte le richieste a questo router
app.use(requestLogger);

//registrazione e login --> richiedono autenticazione
app.use("/auth", authRoutes);

//api users richiedono autenticazione
app.use("/api/v1/", userRoutes);


app.use("/", (req, res) => {
    res.send("Pagina di login");
});

export default app;