import type { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { loginSchema, registerSchema } from '../validators/authValidators.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../errors/appError.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = registerSchema.parse(req.body);
      const result = await this.authService.register(parsed);
      res.status(201).json(successResponse('Registration successful', result));
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await this.authService.login(parsed);
      res.json(successResponse('Login successful', result));
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub ?? 'unknown';
    const result = await this.authService.logout(userId);
    res.json(successResponse('Logout successful', result));
  };
}
