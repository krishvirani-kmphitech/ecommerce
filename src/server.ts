import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./db/mongoose.js";
import { logger } from "./utils/logger.js";
import { makePayementToSeller, startOrderStatusCron } from "./services/orderCronService.js";

async function main(): Promise<void> {
  await connectMongo();
  const app = createApp();

  // Start cron jobs
  startOrderStatusCron();
  makePayementToSeller();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exitCode = 1;
});
