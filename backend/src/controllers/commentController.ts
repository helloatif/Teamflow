import type { NextFunction, Response } from 'express';
import { AppError } from '../errors/appError.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { CommentService } from '../services/commentService.js';
import { createCommentSchema, updateCommentSchema } from '../validators/commentValidators.js';

export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message ?? 'Invalid comment data', 400));
    try {
      const comment = await this.commentService.createComment(String(req.params.projectId), String(req.params.taskId), req.user!.sub, parsed.data.content);
      res.status(201).json({ success: true, data: comment });
    } catch (error) { next(error); }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comments = await this.commentService.listComments(String(req.params.projectId), String(req.params.taskId), req.user!.sub);
      res.json({ success: true, data: comments });
    } catch (error) { next(error); }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = updateCommentSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message ?? 'Invalid comment data', 400));
    try {
      const comment = await this.commentService.updateComment(String(req.params.projectId), String(req.params.taskId), String(req.params.commentId), req.user!.sub, parsed.data.content);
      res.json({ success: true, data: comment });
    } catch (error) { next(error); }
  };

  remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.commentService.deleteComment(String(req.params.projectId), String(req.params.taskId), String(req.params.commentId), req.user!.sub);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };
}
