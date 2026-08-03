import { describe, expect, it } from 'vitest';
import type { ActivityLogRecord, ActivityLogRepository } from '../repositories/activityLogRepository.js';
import { ActivityLogService } from '../services/activityLogService.js';
import { listActivitySchema } from '../validators/activityLogValidators.js';

class InMemoryActivityLogRepository implements ActivityLogRepository {
  private logs: ActivityLogRecord[] = [];

  async create(input: Omit<ActivityLogRecord, 'id' | 'createdAt'>) {
    const log: ActivityLogRecord = { id: `activity-${this.logs.length + 1}`, ...input, createdAt: new Date(Date.now() + this.logs.length) };
    this.logs.push(log);
    return log;
  }

  async findByTeam(input: { teamId: string; entityType?: ActivityLogRecord['entityType']; action?: ActivityLogRecord['action']; limit?: number }) {
    return this.logs
      .filter((log) => log.teamId === input.teamId)
      .filter((log) => !input.entityType || log.entityType === input.entityType)
      .filter((log) => !input.action || log.action === input.action)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, input.limit ?? 50);
  }
}

describe('ActivityLogService', () => {
  it('persists task, project, and comment activity events', async () => {
    const service = new ActivityLogService(new InMemoryActivityLogRepository());
    await service.record({ teamId: 'team-1', userId: 'user-1', entityType: 'TASK', entityId: 'task-1', action: 'CREATED' });
    await service.record({ teamId: 'team-1', userId: 'user-1', entityType: 'PROJECT', entityId: 'project-1', action: 'CREATED' });
    await expect(service.record({ teamId: 'team-1', userId: 'user-1', entityType: 'COMMENT', entityId: 'comment-1', action: 'COMMENT_ADDED' }))
      .resolves.toMatchObject({ action: 'COMMENT_ADDED', entityType: 'COMMENT' });
  });

  it('lists newest first and filters activity', async () => {
    const service = new ActivityLogService(new InMemoryActivityLogRepository());
    await service.record({ teamId: 'team-1', userId: 'user-1', entityType: 'TASK', entityId: 'task-1', action: 'CREATED' });
    await service.record({ teamId: 'team-1', userId: 'user-1', entityType: 'TASK', entityId: 'task-1', action: 'STATUS_CHANGED' });
    await service.record({ teamId: 'team-1', userId: 'user-1', entityType: 'COMMENT', entityId: 'comment-1', action: 'COMMENT_ADDED' });
    await expect(service.list('team-1', { entityType: 'TASK', limit: 1 })).resolves.toMatchObject([{ action: 'STATUS_CHANGED' }]);
    await expect(service.list('team-1', { action: 'COMMENT_ADDED' })).resolves.toHaveLength(1);
  });

  it('rejects invalid activity filters', () => {
    expect(listActivitySchema.safeParse({ entityType: 'INVALID' }).success).toBe(false);
    expect(listActivitySchema.safeParse({ action: 'UNKNOWN' }).success).toBe(false);
    expect(listActivitySchema.safeParse({ limit: '101' }).success).toBe(false);
  });
});
