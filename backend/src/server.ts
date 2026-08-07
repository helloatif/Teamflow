import { createApp } from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

const port = env.PORT;
const app = createApp();

const startServer = async (): Promise<void> => {
  try {
    await connectRedis();
  } catch (error) {
    logger.warn({ err: error }, 'Redis unavailable; continuing without cache');
  }

  app.listen(port, () => {
    logger.info(`TeamFlow backend listening on port ${port}`);
  });
};

const shutdown = async (): Promise<void> => {
  await disconnectRedis();
  process.exit(0);
};

process.once('SIGTERM', () => { void shutdown(); });
process.once('SIGINT', () => { void shutdown(); });

void startServer();
