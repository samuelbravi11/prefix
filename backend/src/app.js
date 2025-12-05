import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/", userRoutes);

app.use("/", (req, res) => {
    res.send("API funzionante");
});

export default app;