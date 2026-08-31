import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  ActivityAction,
  ActivityEntityType,
  ActivityLogMetadata,
  ActivityLogRecord,
  ActivityLogRepository,
} from './activityLogRepository.js';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isPrismaJsonNull = (value: unknown): boolean => (value as any) === Prisma.JsonNull;

const prismaJsonValueToJs = (value: Prisma.JsonValue | Prisma.JsonArray | Prisma.JsonObject | null | undefined): unknown => {
  if (value === null || value === undefined || isPrismaJsonNull(value)) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => prismaJsonValueToJs(item as Prisma.JsonValue));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, prismaJsonValueToJs(nestedValue as Prisma.JsonValue)]),
    );
  }

  return value;
};

const toPrismaJsonValue = (value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput => {
  if (value === null) {
    return Prisma.JsonNull;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPrismaJsonValue(item)) as Prisma.InputJsonValue;
  }

  if (isPlainObject(value)) {
    const result: Record<string, Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = toPrismaJsonValue(nestedValue);
    }
    return result as Prisma.InputJsonValue;
  }

  throw new TypeError('Activity log metadata contains unsupported JSON value type');
};

const toPrismaMetadata = (metadata: ActivityLogMetadata | undefined): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined => {
  if (metadata === undefined) return undefined;
  if (metadata === null) return Prisma.JsonNull;
  if (!isPlainObject(metadata)) {
    throw new TypeError('Activity log metadata must be an object or null');
  }
  return toPrismaJsonValue(metadata);
};

const fromPrismaMetadata = (metadata: Prisma.JsonValue | null | undefined): ActivityLogMetadata => {
  if (metadata === null || metadata === undefined || isPrismaJsonNull(metadata)) {
    return null;
  }

  if (!isPlainObject(metadata)) {
    return null;
  }

  return prismaJsonValueToJs(metadata) as Record<string, unknown>;
};

export class PrismaActivityLogRepository implements ActivityLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: Omit<ActivityLogRecord, 'id' | 'createdAt'>): Promise<ActivityLogRecord> {
    const activity = await this.prisma.activityLog.create({
      data: { ...input, metadata: toPrismaMetadata(input.metadata) },
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
    return { ...activity, metadata: fromPrismaMetadata(activity.metadata) };
  }
}
