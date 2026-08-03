import type { NextFunction, Response } from 'express';
import type { TeamRole } from '../repositories/teamRepository.js';
import type { ProjectService } from '../services/projectService.js';
import { AppError } from '../errors/appError.js';
import type { AuthenticatedRequest } from './authenticate.js';

export const authorizeProjectRole = (projectService: ProjectService, roles?: TeamRole[]) =>
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const { membership } = await projectService.requireProjectMembership(String(req.params.projectId), req.user!.sub);
      if (roles && !roles.includes(membership.role)) {
        throw new AppError('You do not have permission to perform this action', 403);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
