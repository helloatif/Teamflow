import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authenticate.js';
import { PrismaNotificationRepository } from '../repositories/prismaNotificationRepository.js';
import { NotificationService } from '../services/notificationService.js';

const router = Router();
const controller = new NotificationController(new NotificationService(new PrismaNotificationRepository(prisma)));

router.use(authenticate);
router.get('/', controller.list);
router.patch('/read-all', controller.markAllRead);
router.patch('/:notificationId/read', controller.markRead);

export default router;
