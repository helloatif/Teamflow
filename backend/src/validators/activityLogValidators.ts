import { z } from 'zod';

const entityType = z.enum(['PROJECT', 'TASK', 'COMMENT', 'TEAM']);
const action = z.enum(['CREATED', 'UPDATED', 'DELETED', 'ASSIGNED', 'UNASSIGNED', 'STATUS_CHANGED', 'ROLE_CHANGED', 'COMMENT_ADDED', 'COMMENT_EDITED', 'COMMENT_DELETED']);

export const listActivitySchema = z.object({
  entityType: entityType.optional(),
  action: action.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
