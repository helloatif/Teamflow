import type { NextFunction, Request, Response } from 'express';
import { httpRequestDurationSeconds, httpRequestsTotal } from '../config/metrics.js';
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const end = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => { const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path; const labels = { method: req.method, route, status_code: String(res.statusCode) }; end(labels); httpRequestsTotal.inc(labels); });
  next();
};
