import type { PrismaClient } from '@prisma/client';
import type { TaskPriority, TaskRecord, TaskRepository, TaskStatus } from './taskRepository.js';

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { title: string; description?: string | null; projectId: string; createdBy: string }): Promise<TaskRecord> {
    return this.prisma.task.create({ data: { ...input, description: input.description ?? null } });
  }

  async findById(id: string): Promise<TaskRecord | null> {
    return this.prisma.task.findUnique({ where: { id } });
  }

  async findByProject(projectId: string): Promise<TaskRecord[]> {
    return this.prisma.task.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, input: { title?: string; description?: string | null; status?: TaskStatus; priority?: TaskPriority }): Promise<TaskRecord> {
    return this.prisma.task.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  async updateAssignee(id: string, assigneeId: string | null): Promise<TaskRecord> {
    return this.prisma.task.update({ where: { id }, data: { assigneeId } });
  }
}
