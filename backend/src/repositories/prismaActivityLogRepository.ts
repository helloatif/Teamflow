import type { Prisma, PrismaClient } from '@prisma/client';
import type { ActivityAction, ActivityEntityType, ActivityLogRecord, ActivityLogRepository } from './activityLogRepository.js';

export class PrismaActivityLogRepository implements ActivityLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: Omit<ActivityLogRecord, 'id' | 'createdAt'>): Promise<ActivityLogRecord> {
    const activity = await this.prisma.activityLog.create({
      data: { ...input, metadata: input.metadata as Prisma.InputJsonValue | undefined },
    });
    return this.toRecord(activity);
  }

  async findByTeam(input: { teamId: string; entityType?: ActivityEntityType; action?: ActivityAction; limit?: number }): Promise<ActivityLogRecord[]> {
    const activities = await this.prisma.activityLog.findMany({
      where: { teamId: input.teamId, entityType: input.entityType, action: input.action },
      orderBy: { createdAt: 'desc' },
      take: input.limit ?? 50,
    });
    return activities.map((activity) => this.toRecord(activity));
  }

  private toRecord(activity: {
    id: string; teamId: string; userId: string; entityType: ActivityEntityType; entityId: string; action: ActivityAction; metadata: Prisma.JsonValue | null; createdAt: Date;
  }): ActivityLogRecord {
    return { ...activity, metadata: activity.metadata as Record<string, unknown> | null };
  }
}
