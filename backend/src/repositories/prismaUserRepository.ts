import { PrismaClient } from '@prisma/client';
import type { UserRepository, UserRecord } from './userRepository.js';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      emailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(user: Omit<UserRecord, 'createdAt' | 'updatedAt'> & { createdAt?: Date; updatedAt?: Date }): Promise<UserRecord> {
    const created = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        isActive: user.isActive,
        isEmailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      passwordHash: created.passwordHash,
      isActive: created.isActive,
      emailVerified: created.isEmailVerified,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async incrementRefreshTokenVersion(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenVersion: { increment: 1 },
      },
    });
  }
}
