import { createApp } from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';

const port = env.PORT;
const app = createApp();

app.listen(port, () => {
  logger.info(`TeamFlow backend listening on port ${port}`);
});
