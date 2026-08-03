import type { NextFunction, Response } from 'express';
import { AppError } from '../errors/appError.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { NotificationService } from '../services/notificationService.js';
import { listNotificationsSchema, notificationIdSchema } from '../validators/notificationValidators.js';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = listNotificationsSchema.safeParse(req.query);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message ?? 'Invalid notification filters', 400));
    try {
      const notifications = await this.notificationService.listForUser(req.user!.sub, parsed.data);
      res.json({ success: true, data: notifications });
    } catch (error) { next(error); }
  };

  markRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = notificationIdSchema.safeParse(req.params.notificationId);
    if (!parsed.success) return next(new AppError('Invalid notification ID', 400));
    try {
      const result = await this.notificationService.markRead(parsed.data, req.user!.sub);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };

  markAllRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.notificationService.markAllRead(req.user!.sub);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };
}
