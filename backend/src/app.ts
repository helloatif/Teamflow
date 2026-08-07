import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';
import { createTeamsRouter } from './routes/teams.js';
import { createProjectsRouter } from './routes/projects.js';
import { createTasksRouter } from './routes/tasks.js';
import { createCommentsRouter } from './routes/comments.js';
import { createActivityLogsRouter } from './routes/activityLogs.js';
import notificationRoutes from './routes/notifications.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './docs/swagger.js';
import env from './config/env.js';
import logger from './config/logger.js';
import { apiRateLimiter, authRateLimiter, corsOptions } from './middleware/security.js';
import { metricsMiddleware } from './middleware/metrics.js';
import { register } from './config/metrics.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/metrics', async (_req, res, next) => {
    try { res.set('Content-Type', register.contentType); res.end(await register.metrics()); } catch (error) { next(error); }
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/v1', apiRateLimiter);
  app.use('/api/v1', healthRoutes);
  app.use('/api/v1/auth', authRateLimiter, authRoutes);
  app.use('/api/v1', protectedRoutes);
  app.use('/api/v1/teams', createTeamsRouter());
  app.use('/api/v1/teams/:teamId/projects', createProjectsRouter());
  app.use('/api/v1/projects/:projectId/tasks', createTasksRouter());
  app.use('/api/v1/projects/:projectId/tasks/:taskId/comments', createCommentsRouter());
  app.use('/api/v1/teams/:teamId/activity', createActivityLogsRouter());
  app.use('/api/v1/notifications', notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info({ environment: env.NODE_ENV, port: env.PORT }, 'TeamFlow backend initialized');

  return app;
};

export default createApp;
