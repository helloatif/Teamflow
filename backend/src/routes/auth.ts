import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { AuthService } from '../services/authService.js';
import { PrismaUserRepository } from '../repositories/prismaUserRepository.js';
import { prisma } from '../config/prisma.js';

const router = Router();
const authService = new AuthService(new PrismaUserRepository(prisma));
const authController = new AuthController(authService);

router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;
