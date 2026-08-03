import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';
import { authorizeTeamRole } from '../middleware/authorizeTeamRole.js';
import { authenticate } from '../middleware/authenticate.js';
import { prisma } from '../config/prisma.js';
import { PrismaProjectRepository } from '../repositories/prismaProjectRepository.js';
import { PrismaTeamRepository } from '../repositories/prismaTeamRepository.js';
import { ProjectService } from '../services/projectService.js';
import { TeamService } from '../services/teamService.js';

export const createProjectsRouter = () => {
  const router = Router({ mergeParams: true });
  const teamRepository = new PrismaTeamRepository(prisma);
  const teamService = new TeamService(teamRepository);
  const projectService = new ProjectService(new PrismaProjectRepository(prisma), teamRepository);
  const projectController = new ProjectController(projectService);
  const member = authorizeTeamRole(teamService, undefined, 'teamId');
  const manager = authorizeTeamRole(teamService, ['OWNER', 'ADMIN'], 'teamId');
  const owner = authorizeTeamRole(teamService, ['OWNER'], 'teamId');

  router.use(authenticate);
  router.post('/', manager, projectController.create);
  router.get('/', member, projectController.list);
  router.get('/:projectId', member, projectController.getById);
  router.patch('/:projectId', manager, projectController.update);
  router.delete('/:projectId', owner, projectController.remove);
  return router;
};
