import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/appError.js';
import type { CommentRecord, CommentRepository } from '../repositories/commentRepository.js';
import type { ProjectService } from '../services/projectService.js';
import type { TaskService } from '../services/taskService.js';
import { CommentService } from '../services/commentService.js';
import { createCommentSchema } from '../validators/commentValidators.js';

class InMemoryCommentRepository implements CommentRepository {
  private comments: CommentRecord[] = [];

  async create(input: { taskId: string; authorId: string; content: string }) {
    const comment: CommentRecord = { id: `comment-${this.comments.length + 1}`, ...input, createdAt: new Date(), updatedAt: new Date() };
    this.comments.push(comment);
    return comment;
  }
  async findById(id: string) { return this.comments.find((comment) => comment.id === id) ?? null; }
  async findByTask(taskId: string) { return this.comments.filter((comment) => comment.taskId === taskId); }
  async update(id: string, content: string) {
    const comment = await this.findById(id);
    if (!comment) throw new Error('Comment not found');
    comment.content = content;
    comment.updatedAt = new Date();
    return comment;
  }
  async delete(id: string) { this.comments = this.comments.filter((comment) => comment.id !== id); }
}

const taskService = {
  getTask: async (projectId: string, taskId: string, userId: string) => {
    if (projectId !== 'project-1' || taskId !== 'task-1') throw new AppError('Task not found', 404);
    if (userId === 'outsider') throw new AppError('You are not a member of this team', 403);
    return { id: taskId, projectId };
  },
} as unknown as TaskService;

const projectService = {
  requireProjectMembership: async (projectId: string, userId: string) => {
    if (projectId !== 'project-1') throw new AppError('Project not found', 404);
    if (userId === 'outsider') throw new AppError('You are not a member of this team', 403);
    return { project: { id: projectId, teamId: 'team-1' }, membership: { role: userId === 'owner' ? 'OWNER' : 'MEMBER' } };
  },
} as unknown as ProjectService;

const createService = () => new CommentService(new InMemoryCommentRepository(), taskService, projectService);

describe('CommentService', () => {
  it('creates and lists comments for a task member', async () => {
    const service = createService();
    await expect(service.createComment('project-1', 'task-1', 'member', '  First comment  '))
      .resolves.toMatchObject({ content: 'First comment', authorId: 'member' });
    await expect(service.listComments('project-1', 'task-1', 'member')).resolves.toHaveLength(1);
  });

  it('allows an author to edit and delete their comment', async () => {
    const service = createService();
    const comment = await service.createComment('project-1', 'task-1', 'member', 'Original');
    await expect(service.updateComment('project-1', 'task-1', comment.id, 'member', 'Updated')).resolves.toMatchObject({ content: 'Updated' });
    await expect(service.deleteComment('project-1', 'task-1', comment.id, 'member')).resolves.toEqual({ success: true });
  });

  it('allows an owner to edit and delete another member’s comment', async () => {
    const service = createService();
    const comment = await service.createComment('project-1', 'task-1', 'member', 'Original');
    await expect(service.updateComment('project-1', 'task-1', comment.id, 'owner', 'Owner edit')).resolves.toMatchObject({ content: 'Owner edit' });
    await expect(service.deleteComment('project-1', 'task-1', comment.id, 'owner')).resolves.toEqual({ success: true });
  });

  it('rejects another member and outsiders', async () => {
    const service = createService();
    const comment = await service.createComment('project-1', 'task-1', 'member', 'Original');
    await expect(service.updateComment('project-1', 'task-1', comment.id, 'other-member', 'Denied')).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.listComments('project-1', 'task-1', 'outsider')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects invalid comment content', () => {
    expect(createCommentSchema.safeParse({ content: '   ' }).success).toBe(false);
    expect(createCommentSchema.safeParse({ content: 'x'.repeat(2_001) }).success).toBe(false);
  });
});
