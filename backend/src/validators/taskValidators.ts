import { z } from 'zod';

const taskTitle = z.string().trim().min(1, 'Task title is required').max(200);
const taskDescription = z.string().trim().max(5_000).nullable().optional();
const taskStatus = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
const taskPriority = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const createTaskSchema = z.object({ title: taskTitle, description: taskDescription });
export const updateTaskSchema = z.object({
  title: taskTitle.optional(),
  description: taskDescription,
  status: taskStatus.optional(),
  priority: taskPriority.optional(),
})
  .refine((input) => Object.keys(input).length > 0, 'At least one task field is required');

export const updateTaskAssigneeSchema = z.object({ assigneeId: z.string().trim().min(1).nullable() });
