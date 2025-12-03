import express from "express";
import { logger } from "./middleware/logger.js";
import routes from "./routes/index.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();

app.use(express.json());

// logging middleware
app.use(logger);

// swagger docs
setupSwagger(app);

// API routes
app.use("/api/v1", routes);

// Default 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Default error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

export default app;