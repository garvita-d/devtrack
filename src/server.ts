import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`🚀 DevTrack API listening on http://localhost:${env.port}`);
  console.log(`   Health check: http://localhost:${env.port}/health`);
  console.log(`   API docs:     http://localhost:${env.port}/api-docs`);
});
