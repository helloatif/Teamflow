import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './docs/swagger.js';
import env from './config/env.js';
import logger from './config/logger.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

logger.info({ environment: env.NODE_ENV, port: env.PORT }, 'TeamFlow backend initialized');

export default app;
