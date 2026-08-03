import type { CorsOptions } from 'cors';
import { rateLimit } from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/appError.js';
import env from '../config/env.js';
import logger from '../config/logger.js';

const rateLimitHandler = (req: Request, res: Response, _next: NextFunction): void => {
  logger.warn({ event: 'rate_limit_exceeded', method: req.method, path: req.originalUrl, ip: req.ip }, 'Rate limit exceeded');
  res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
};

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    logger.warn({ event: 'cors_origin_rejected', origin }, 'CORS origin rejected');
    callback(new AppError('Origin not allowed by CORS policy', 403));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
};
