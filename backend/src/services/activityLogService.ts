import type { ActivityAction, ActivityEntityType, ActivityLogRepository } from '../repositories/activityLogRepository.js';

export class ActivityLogService {
  constructor(private readonly activityLogRepository: ActivityLogRepository) {}

  async record(input: {
    teamId: string;
    userId: string;
    entityType: ActivityEntityType;
    entityId: string;
    action: ActivityAction;
    metadata?: Record<string, unknown> | null;
  }) {
    return this.activityLogRepository.create({ ...input, metadata: input.metadata ?? null });
  }

  async list(teamId: string, filters: { entityType?: ActivityEntityType; action?: ActivityAction; limit?: number }) {
    return this.activityLogRepository.findByTeam({ teamId, ...filters });
  }
}
