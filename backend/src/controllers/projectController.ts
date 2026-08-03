import type { NextFunction, Response } from 'express';
import type { ProjectService } from '../services/projectService.js';
import { AppError } from '../errors/appError.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidators.js';

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message ?? 'Invalid project data', 400));
    try {
      const project = await this.projectService.createProject({ teamId: String(req.params.teamId), actorId: req.user!.sub, ...parsed.data });
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projects = await this.projectService.listProjects(String(req.params.teamId));
      res.json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await this.projectService.getProject(String(req.params.teamId), String(req.params.projectId));
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message ?? 'Invalid project data', 400));
    try {
      const project = await this.projectService.updateProject(String(req.params.teamId), String(req.params.projectId), parsed.data);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.projectService.deleteProject(String(req.params.teamId), String(req.params.projectId), req.user!.sub);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
