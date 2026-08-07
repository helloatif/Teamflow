import { Router } from 'express';
import { TeamController } from '../controllers/teamController.js';
import { TeamService } from '../services/teamService.js';
import { PrismaTeamRepository } from '../repositories/prismaTeamRepository.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeTeamRole } from '../middleware/authorizeTeamRole.js';
import { prisma } from '../config/prisma.js';
import { cacheService } from '../services/cacheService.js';

export const createTeamsRouter = () => {
  const router = Router();
  const teamRepository = new PrismaTeamRepository(prisma);
  const teamService = new TeamService(teamRepository, cacheService);
  const teamController = new TeamController(teamService);

  router.use(authenticate);
  router.post('/', teamController.create);
  router.get('/', teamController.list);
  router.post('/:id/members', authorizeTeamRole(teamService, ['OWNER', 'ADMIN']), teamController.inviteMember);
  router.get('/:id/members', authorizeTeamRole(teamService), teamController.listMembers);
  router.patch('/:id/members/:userId', authorizeTeamRole(teamService, ['OWNER']), teamController.changeMemberRole);
  router.delete('/:id/members/:userId', authorizeTeamRole(teamService, ['OWNER', 'ADMIN']), teamController.removeMember);
  router.get('/:id', authorizeTeamRole(teamService), teamController.getById);
  router.patch('/:id', authorizeTeamRole(teamService, ['OWNER', 'ADMIN']), teamController.update);
  router.delete('/:id', authorizeTeamRole(teamService, ['OWNER']), teamController.remove);

  return router;
};
