export type ActivityEntityType = 'PROJECT' | 'TASK' | 'COMMENT' | 'TEAM';
export type ActivityAction =
  | 'CREATED' | 'UPDATED' | 'DELETED' | 'ASSIGNED' | 'UNASSIGNED'
  | 'STATUS_CHANGED' | 'ROLE_CHANGED' | 'COMMENT_ADDED' | 'COMMENT_EDITED' | 'COMMENT_DELETED';

export interface ActivityLogRecord {
  id: string;
  teamId: string;
  userId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ActivityLogRepository {
  create(input: Omit<ActivityLogRecord, 'id' | 'createdAt'>): Promise<ActivityLogRecord>;
  findByTeam(input: { teamId: string; entityType?: ActivityEntityType; action?: ActivityAction; limit?: number }): Promise<ActivityLogRecord[]>;
}
