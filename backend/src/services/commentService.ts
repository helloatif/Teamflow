import { AppError } from '../errors/appError.js';
import type { CommentRepository } from '../repositories/commentRepository.js';
import type { ProjectService } from './projectService.js';
import type { TaskService } from './taskService.js';
import type { ActivityLogService } from './activityLogService.js';
import type { NotificationService } from './notificationService.js';

export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly taskService: TaskService,
    private readonly projectService: ProjectService,
    private readonly activityLogService?: ActivityLogService,
    private readonly notificationService?: NotificationService
  ) {}

  async createComment(projectId: string, taskId: string, authorId: string, content: string) {
    const { project } = await this.projectService.requireProjectMembership(projectId, authorId);
    const task = await this.taskService.getTask(projectId, taskId, authorId);
    const comment = await this.commentRepository.create({ taskId, authorId, content: content.trim() });
    if (this.activityLogService) {
      await this.activityLogService.record({ teamId: project.teamId, userId: authorId, entityType: 'COMMENT', entityId: comment.id, action: 'COMMENT_ADDED', metadata: { taskId } });
    }
    if (this.notificationService && task.assigneeId) {
      await this.notificationService.notify({ recipientId: task.assigneeId, actorId: authorId, type: 'COMMENT_ADDED', entityType: 'COMMENT', entityId: comment.id });
    }
    return comment;
  }

  async listComments(projectId: string, taskId: string, userId: string) {
    await this.taskService.getTask(projectId, taskId, userId);
    return this.commentRepository.findByTask(taskId);
  }

  async updateComment(projectId: string, taskId: string, commentId: string, actorId: string, content: string) {
    const { membership } = await this.projectService.requireProjectMembership(projectId, actorId);
    await this.taskService.getTask(projectId, taskId, actorId);
    const comment = await this.requireCommentOnTask(taskId, commentId);
    this.assertCanManageComment(comment.authorId, actorId, membership.role);
    const updated = await this.commentRepository.update(comment.id, content.trim());
    if (this.activityLogService) {
      const { project } = await this.projectService.requireProjectMembership(projectId, actorId);
      await this.activityLogService.record({ teamId: project.teamId, userId: actorId, entityType: 'COMMENT', entityId: comment.id, action: 'COMMENT_EDITED', metadata: { taskId } });
    }
    return updated;
  }

  async deleteComment(projectId: string, taskId: string, commentId: string, actorId: string) {
    const { membership } = await this.projectService.requireProjectMembership(projectId, actorId);
    await this.taskService.getTask(projectId, taskId, actorId);
    const comment = await this.requireCommentOnTask(taskId, commentId);
    this.assertCanManageComment(comment.authorId, actorId, membership.role);
    await this.commentRepository.delete(comment.id);
    if (this.activityLogService) {
      const { project } = await this.projectService.requireProjectMembership(projectId, actorId);
      await this.activityLogService.record({ teamId: project.teamId, userId: actorId, entityType: 'COMMENT', entityId: comment.id, action: 'COMMENT_DELETED', metadata: { taskId } });
    }
    return { success: true };
  }

  private async requireCommentOnTask(taskId: string, commentId: string) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment || comment.taskId !== taskId) {
      throw new AppError('Comment not found', 404);
    }
    return comment;
  }

  private assertCanManageComment(authorId: string, actorId: string, role: string): void {
    if (authorId !== actorId && role !== 'OWNER') {
      throw new AppError('You do not have permission to manage this comment', 403);
    }
  }
}
