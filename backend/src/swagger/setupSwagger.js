// src/proxy/swagger/setupSwagger.js
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(
  path.join(__dirname, "../swagger/openapi.yaml")
);

export function setupSwagger(app) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
    })
  );
}
