import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { TaskController } from '../controllers/taskController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeProjectRole } from '../middleware/authorizeProjectRole.js';
import { PrismaProjectRepository } from '../repositories/prismaProjectRepository.js';
import { PrismaTaskRepository } from '../repositories/prismaTaskRepository.js';
import { PrismaTeamRepository } from '../repositories/prismaTeamRepository.js';
import { PrismaUserRepository } from '../repositories/prismaUserRepository.js';
import { ProjectService } from '../services/projectService.js';
import { TaskService } from '../services/taskService.js';
import { ActivityLogService } from '../services/activityLogService.js';
import { PrismaActivityLogRepository } from '../repositories/prismaActivityLogRepository.js';
import { PrismaNotificationRepository } from '../repositories/prismaNotificationRepository.js';
import { NotificationService } from '../services/notificationService.js';

export const createTasksRouter = () => {
  const router = Router({ mergeParams: true });
  const teamRepository = new PrismaTeamRepository(prisma);
  const projectService = new ProjectService(new PrismaProjectRepository(prisma), teamRepository);
  const taskController = new TaskController(new TaskService(
    new PrismaTaskRepository(prisma), projectService, new PrismaUserRepository(prisma), teamRepository,
    new ActivityLogService(new PrismaActivityLogRepository(prisma)),
    new NotificationService(new PrismaNotificationRepository(prisma))
  ));
  const member = authorizeProjectRole(projectService);
  const manager = authorizeProjectRole(projectService, ['OWNER', 'ADMIN']);

  router.use(authenticate);
  router.post('/', manager, taskController.create);
  router.get('/', member, taskController.list);
  router.get('/:taskId', member, taskController.getById);
  router.patch('/:taskId/assignee', manager, taskController.updateAssignee);
  router.patch('/:taskId', manager, taskController.update);
  router.delete('/:taskId', manager, taskController.remove);
  return router;
};
