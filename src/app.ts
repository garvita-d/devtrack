import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { openApiDocument } from "./docs/openapi";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, message: "DevTrack API is running" });
  });

  // Interactive API docs at /api-docs, raw spec at /api-docs.json (handy
  // for importing into Postman/Insomnia, or for tools that consume it
  // programmatically).
  app.get("/api-docs.json", (_req, res) => res.json(openApiDocument));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
