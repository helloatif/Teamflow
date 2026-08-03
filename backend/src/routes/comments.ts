import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { CommentController } from '../controllers/commentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeProjectRole } from '../middleware/authorizeProjectRole.js';
import { PrismaCommentRepository } from '../repositories/prismaCommentRepository.js';
import { PrismaProjectRepository } from '../repositories/prismaProjectRepository.js';
import { PrismaTaskRepository } from '../repositories/prismaTaskRepository.js';
import { PrismaTeamRepository } from '../repositories/prismaTeamRepository.js';
import { PrismaUserRepository } from '../repositories/prismaUserRepository.js';
import { CommentService } from '../services/commentService.js';
import { ProjectService } from '../services/projectService.js';
import { TaskService } from '../services/taskService.js';
import { ActivityLogService } from '../services/activityLogService.js';
import { PrismaActivityLogRepository } from '../repositories/prismaActivityLogRepository.js';
import { PrismaNotificationRepository } from '../repositories/prismaNotificationRepository.js';
import { NotificationService } from '../services/notificationService.js';

export const createCommentsRouter = () => {
  const router = Router({ mergeParams: true });
  const teamRepository = new PrismaTeamRepository(prisma);
  const projectService = new ProjectService(new PrismaProjectRepository(prisma), teamRepository);
  const taskService = new TaskService(new PrismaTaskRepository(prisma), projectService, new PrismaUserRepository(prisma), teamRepository);
  const commentController = new CommentController(new CommentService(
    new PrismaCommentRepository(prisma), taskService, projectService,
    new ActivityLogService(new PrismaActivityLogRepository(prisma)),
    new NotificationService(new PrismaNotificationRepository(prisma))
  ));
  const member = authorizeProjectRole(projectService);

  router.use(authenticate, member);
  router.post('/', commentController.create);
  router.get('/', commentController.list);
  router.patch('/:commentId', commentController.update);
  router.delete('/:commentId', commentController.remove);
  return router;
};
