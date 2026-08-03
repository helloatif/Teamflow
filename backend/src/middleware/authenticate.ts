import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/appError.js';
import { verifyAccessToken } from '../utils/jwt.js';

interface TokenPayloadShape {
  sub?: string;
  email?: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Unauthorized', 401));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    if (typeof decoded === 'object' && decoded !== null) {
      const payload = decoded as TokenPayloadShape;
      req.user = {
        sub: payload.sub ?? '',
        email: payload.email ?? '',
        role: payload.role ?? 'MEMBER',
      };
      next();
      return;
    }
  } catch {
    next(new AppError('Unauthorized', 401));
    return;
  }

  next(new AppError('Unauthorized', 401));
};
