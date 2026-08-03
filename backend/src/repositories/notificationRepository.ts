export type NotificationType = 'TASK_ASSIGNED' | 'COMMENT_ADDED' | 'TASK_COMPLETED' | 'MENTION';
export type NotificationEntityType = 'PROJECT' | 'TASK' | 'COMMENT' | 'TEAM';

export interface NotificationRecord {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationRepository {
  create(input: Omit<NotificationRecord, 'id' | 'isRead' | 'createdAt'>): Promise<NotificationRecord>;
  findByRecipient(input: { recipientId: string; unread?: boolean; limit?: number }): Promise<NotificationRecord[]>;
  markRead(id: string, recipientId: string): Promise<boolean>;
  markAllRead(recipientId: string): Promise<number>;
}
