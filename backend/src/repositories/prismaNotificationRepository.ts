import type { PrismaClient } from '@prisma/client';
import type { NotificationRecord, NotificationRepository } from './notificationRepository.js';

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: Omit<NotificationRecord, 'id' | 'isRead' | 'createdAt'>): Promise<NotificationRecord> {
    return this.prisma.notification.create({ data: input });
  }

  async findByRecipient(input: { recipientId: string; unread?: boolean; limit?: number }): Promise<NotificationRecord[]> {
    return this.prisma.notification.findMany({
      where: { recipientId: input.recipientId, ...(input.unread !== undefined ? { isRead: !input.unread } : {}) },
      orderBy: { createdAt: 'desc' },
      take: input.limit ?? 50,
    });
  }

  async markRead(id: string, recipientId: string): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({ where: { id, recipientId }, data: { isRead: true } });
    return result.count > 0;
  }

  async markAllRead(recipientId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({ where: { recipientId, isRead: false }, data: { isRead: true } });
    return result.count;
  }
}
