import type { NextFunction, Response } from 'express';
import { AppError } from '../errors/appError.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { ActivityLogService } from '../services/activityLogService.js';
import { listActivitySchema } from '../validators/activityLogValidators.js';

export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = listActivitySchema.safeParse(req.query);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message ?? 'Invalid activity filters', 400));
    try {
      const activity = await this.activityLogService.list(String(req.params.teamId), parsed.data);
      res.json({ success: true, data: activity });
    } catch (error) { next(error); }
  };
}
