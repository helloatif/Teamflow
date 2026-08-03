import type { NextFunction, Response } from 'express';
import { AppError } from '../errors/appError.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { TaskService } from '../services/taskService.js';
import { createTaskSchema, updateTaskAssigneeSchema, updateTaskSchema } from '../validators/taskValidators.js';

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message ?? 'Invalid task data', 400));
    try {
      const task = await this.taskService.createTask({ projectId: String(req.params.projectId), createdBy: req.user!.sub, ...parsed.data });
      res.status(201).json({ success: true, data: task });
    } catch (error) { next(error); }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tasks = await this.taskService.listTasks(String(req.params.projectId), req.user!.sub);
      res.json({ success: true, data: tasks });
    } catch (error) { next(error); }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.taskService.getTask(String(req.params.projectId), String(req.params.taskId), req.user!.sub);
      res.json({ success: true, data: task });
    } catch (error) { next(error); }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message ?? 'Invalid task data', 400));
    try {
      const task = await this.taskService.updateTask(String(req.params.projectId), String(req.params.taskId), req.user!.sub, parsed.data);
      res.json({ success: true, data: task });
    } catch (error) { next(error); }
  };

  updateAssignee = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = updateTaskAssigneeSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message ?? 'Invalid assignee data', 400));
    try {
      const task = await this.taskService.assignTask(
        String(req.params.projectId),
        String(req.params.taskId),
        req.user!.sub,
        parsed.data.assigneeId
      );
      res.json({ success: true, data: task });
    } catch (error) { next(error); }
  };

  remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.taskService.deleteTask(String(req.params.projectId), String(req.params.taskId), req.user!.sub);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };
}
