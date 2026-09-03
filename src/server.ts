import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const app = createApp();

app.listen(env.port, () => {
  logger.info(`🚀 DevTrack API listening on http://localhost:${env.port}`);
  logger.info(`   Health check: http://localhost:${env.port}/health`);
  logger.info(`   API docs:     http://localhost:${env.port}/api-docs`);
});
