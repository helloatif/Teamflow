import type { PrismaClient } from '@prisma/client';
import type { CommentRecord, CommentRepository } from './commentRepository.js';

export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { taskId: string; authorId: string; content: string }): Promise<CommentRecord> {
    return this.prisma.comment.create({ data: input });
  }

  async findById(id: string): Promise<CommentRecord | null> {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  async findByTask(taskId: string): Promise<CommentRecord[]> {
    return this.prisma.comment.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' } });
  }

  async update(id: string, content: string): Promise<CommentRecord> {
    return this.prisma.comment.update({ where: { id }, data: { content } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
