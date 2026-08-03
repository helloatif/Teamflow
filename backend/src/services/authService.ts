import bcrypt from 'bcryptjs';
import { AppError } from '../errors/appError.js';
import type { UserRepository } from '../repositories/userRepository.js';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(input: RegisterInput) {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.userRepository.create({
      id: crypto.randomUUID(),
      email: input.email,
      name: input.name,
      passwordHash,
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { user };
  }

  async login(input: LoginInput) {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    return { user };
  }
}
