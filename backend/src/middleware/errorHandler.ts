import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { errorResponse } from '../utils/apiResponse.js';
import logger from '../config/logger.js';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  (error as Error & { statusCode?: number }).statusCode = 404;
  next(error);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const statusCode = (err as Error & { statusCode?: number }).statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  logger.error({ err, statusCode, method: req.method, path: req.originalUrl }, 'Request failed');

  res.status(statusCode).json(errorResponse(message));
};
