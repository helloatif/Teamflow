import { AppError } from '../errors/appError.js';
import type { NotificationEntityType, NotificationRepository, NotificationType } from '../repositories/notificationRepository.js';

export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async notify(input: { recipientId: string; actorId: string; type: NotificationType; entityType: NotificationEntityType; entityId: string }) {
    if (input.recipientId === input.actorId) return null;
    return this.notificationRepository.create(input);
  }

  async listForUser(recipientId: string, filters: { unread?: boolean; limit?: number }) {
    return this.notificationRepository.findByRecipient({ recipientId, ...filters });
  }

  async markRead(notificationId: string, recipientId: string) {
    const updated = await this.notificationRepository.markRead(notificationId, recipientId);
    if (!updated) throw new AppError('Notification not found', 404);
    return { success: true };
  }

  async markAllRead(recipientId: string) {
    const updatedCount = await this.notificationRepository.markAllRead(recipientId);
    return { updatedCount };
  }
}
