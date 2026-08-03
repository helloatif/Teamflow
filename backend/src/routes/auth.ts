import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { AuthService } from '../services/authService.js';
import { PrismaUserRepository } from '../repositories/prismaUserRepository.js';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
const authService = new AuthService(new PrismaUserRepository(prisma));
const authController = new AuthController(authService);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);

export default router;
