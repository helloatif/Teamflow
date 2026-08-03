import { z } from 'zod';

const projectName = z.string().trim().min(1, 'Project name is required').max(150);
const projectDescription = z.string().trim().max(2_000).nullable().optional();
const projectStatus = z.enum(['ACTIVE', 'ARCHIVED']);

export const createProjectSchema = z.object({
  name: projectName,
  description: projectDescription,
});

export const updateProjectSchema = z.object({
  name: projectName.optional(),
  description: projectDescription,
  status: projectStatus.optional(),
}).refine((input) => Object.keys(input).length > 0, 'At least one project field is required');
