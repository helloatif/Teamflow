import { describe, expect, it } from 'vitest';
import type { NotificationRecord, NotificationRepository } from '../repositories/notificationRepository.js';
import { NotificationService } from '../services/notificationService.js';
import { listNotificationsSchema, notificationIdSchema } from '../validators/notificationValidators.js';

class InMemoryNotificationRepository implements NotificationRepository {
  private notifications: NotificationRecord[] = [];

  async create(input: Omit<NotificationRecord, 'id' | 'isRead' | 'createdAt'>) {
    const notification: NotificationRecord = { id: `00000000-0000-4000-8000-00000000000${this.notifications.length + 1}`, ...input, isRead: false, createdAt: new Date(Date.now() + this.notifications.length) };
    this.notifications.push(notification);
    return notification;
  }
  async findByRecipient(input: { recipientId: string; unread?: boolean; limit?: number }) {
    return this.notifications.filter((notification) => notification.recipientId === input.recipientId)
      .filter((notification) => input.unread === undefined || notification.isRead === !input.unread)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, input.limit ?? 50);
  }
  async markRead(id: string, recipientId: string) {
    const notification = this.notifications.find((item) => item.id === id && item.recipientId === recipientId);
    if (!notification) return false;
    notification.isRead = true;
    return true;
  }
  async markAllRead(recipientId: string) {
    const unread = this.notifications.filter((item) => item.recipientId === recipientId && !item.isRead);
    unread.forEach((item) => { item.isRead = true; });
    return unread.length;
  }
}

describe('NotificationService', () => {
  it('creates task assignment, comment, and completion notifications', async () => {
    const service = new NotificationService(new InMemoryNotificationRepository());
    await expect(service.notify({ recipientId: 'member', actorId: 'owner', type: 'TASK_ASSIGNED', entityType: 'TASK', entityId: 'task-1' })).resolves.toMatchObject({ type: 'TASK_ASSIGNED' });
    await expect(service.notify({ recipientId: 'member', actorId: 'owner', type: 'COMMENT_ADDED', entityType: 'COMMENT', entityId: 'comment-1' })).resolves.toMatchObject({ type: 'COMMENT_ADDED' });
    await expect(service.notify({ recipientId: 'owner', actorId: 'member', type: 'TASK_COMPLETED', entityType: 'TASK', entityId: 'task-1' })).resolves.toMatchObject({ type: 'TASK_COMPLETED' });
  });

  it('does not create self-notifications', async () => {
    const service = new NotificationService(new InMemoryNotificationRepository());
    await expect(service.notify({ recipientId: 'user-1', actorId: 'user-1', type: 'TASK_ASSIGNED', entityType: 'TASK', entityId: 'task-1' })).resolves.toBeNull();
  });

  it('lists unread notifications and marks one or all as read', async () => {
    const service = new NotificationService(new InMemoryNotificationRepository());
    const first = await service.notify({ recipientId: 'member', actorId: 'owner', type: 'TASK_ASSIGNED', entityType: 'TASK', entityId: 'task-1' });
    await service.notify({ recipientId: 'member', actorId: 'owner', type: 'COMMENT_ADDED', entityType: 'COMMENT', entityId: 'comment-1' });
    await expect(service.listForUser('member', { unread: true })).resolves.toHaveLength(2);
    await expect(service.markRead(first!.id, 'member')).resolves.toEqual({ success: true });
    await expect(service.markAllRead('member')).resolves.toEqual({ updatedCount: 1 });
  });

  it('does not allow another user to mark a notification as read', async () => {
    const service = new NotificationService(new InMemoryNotificationRepository());
    const notification = await service.notify({ recipientId: 'member', actorId: 'owner', type: 'TASK_ASSIGNED', entityType: 'TASK', entityId: 'task-1' });
    await expect(service.markRead(notification!.id, 'outsider')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects invalid notification parameters', () => {
    expect(notificationIdSchema.safeParse('not-a-uuid').success).toBe(false);
    expect(listNotificationsSchema.safeParse({ unread: 'yes' }).success).toBe(false);
    expect(listNotificationsSchema.safeParse({ limit: '101' }).success).toBe(false);
  });
});
