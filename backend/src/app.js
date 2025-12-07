import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import requestLogger from "./middleware/requestLogger.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: "http://localhost:5173", // porta di Vue
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