import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { ActivityLogController } from '../controllers/activityLogController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeTeamRole } from '../middleware/authorizeTeamRole.js';
import { PrismaActivityLogRepository } from '../repositories/prismaActivityLogRepository.js';
import { PrismaTeamRepository } from '../repositories/prismaTeamRepository.js';
import { ActivityLogService } from '../services/activityLogService.js';
import { TeamService } from '../services/teamService.js';

export const createActivityLogsRouter = () => {
  const router = Router({ mergeParams: true });
  const teamService = new TeamService(new PrismaTeamRepository(prisma));
  const controller = new ActivityLogController(new ActivityLogService(new PrismaActivityLogRepository(prisma)));

  router.use(authenticate, authorizeTeamRole(teamService, undefined, 'teamId'));
  router.get('/', controller.list);
  return router;
};
