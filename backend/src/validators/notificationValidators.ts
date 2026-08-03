import { z } from 'zod';

export const notificationIdSchema = z.string().uuid();
export const listNotificationsSchema = z.object({
  unread: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
