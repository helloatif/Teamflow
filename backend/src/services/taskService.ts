import { AppError } from '../errors/appError.js';
import type { ProjectService } from './projectService.js';
import type { TaskPriority, TaskRepository, TaskStatus } from '../repositories/taskRepository.js';
import type { TeamRepository } from '../repositories/teamRepository.js';
import type { UserRepository } from '../repositories/userRepository.js';
import type { ActivityLogService } from './activityLogService.js';
import type { NotificationService } from './notificationService.js';
import type { Cache } from './cacheService.js';

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly projectService: ProjectService,
    private readonly userRepository: UserRepository,
    private readonly teamRepository: TeamRepository,
    private readonly activityLogService?: ActivityLogService,
    private readonly notificationService?: NotificationService,
    private readonly cache?: Cache
  ) {}

  async createTask(input: { projectId: string; title: string; description?: string | null; createdBy: string }) {
    const { project } = await this.projectService.requireProjectMembership(input.projectId, input.createdBy);
    const task = await this.taskRepository.create({
      projectId: input.projectId,
      createdBy: input.createdBy,
      title: input.title.trim(),
      description: input.description?.trim() || null,
    });
    if (this.activityLogService) {
      await this.activityLogService.record({ teamId: project.teamId, userId: input.createdBy, entityType: 'TASK', entityId: task.id, action: 'CREATED', metadata: { title: task.title } });
    }
    await this.cache?.delete(`tasks:project:${input.projectId}`);
    return task;
  }

  async getTask(projectId: string, taskId: string, userId: string) {
    await this.projectService.requireProjectMembership(projectId, userId);
    const key = `task:${taskId}`;
    const cached = await this.cache?.get<NonNullable<Awaited<ReturnType<TaskRepository['findById']>>>>(key);
    if (cached && cached.projectId === projectId) return cached;
    const task = await this.requireTaskInProject(projectId, taskId);
    await this.cache?.set(key, task);
    return task;
  }

  async listTasks(projectId: string, userId: string) {
    await this.projectService.requireProjectMembership(projectId, userId);
    const key = `tasks:project:${projectId}`;
    const cached = await this.cache?.get<Awaited<ReturnType<TaskRepository['findByProject']>>>(key);
    if (cached) return cached;
    const tasks = await this.taskRepository.findByProject(projectId);
    await this.cache?.set(key, tasks);
    return tasks;
  }

  async updateTask(
    projectId: string,
    taskId: string,
    userId: string,
    input: { title?: string; description?: string | null; status?: TaskStatus; priority?: TaskPriority }
  ) {
    const { project } = await this.projectService.requireProjectMembership(projectId, userId);
    const task = await this.requireTaskInProject(projectId, taskId);
    const updated = await this.taskRepository.update(task.id, {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
    });
    if (this.activityLogService) {
      const action = input.status !== undefined ? 'STATUS_CHANGED' : 'UPDATED';
      await this.activityLogService.record({ teamId: project.teamId, userId, entityType: 'TASK', entityId: task.id, action, metadata: { status: updated.status, priority: updated.priority } });
    }
    if (this.notificationService && input.status === 'DONE' && task.status !== 'DONE') {
      await this.notificationService.notify({ recipientId: task.createdBy, actorId: userId, type: 'TASK_COMPLETED', entityType: 'TASK', entityId: task.id });
    }
    await this.invalidate(projectId, task.id);
    return updated;
  }

  async deleteTask(projectId: string, taskId: string, userId: string) {
    const { project } = await this.projectService.requireProjectMembership(projectId, userId);
    const task = await this.requireTaskInProject(projectId, taskId);
    await this.taskRepository.delete(task.id);
    if (this.activityLogService) {
      await this.activityLogService.record({ teamId: project.teamId, userId, entityType: 'TASK', entityId: task.id, action: 'DELETED', metadata: { title: task.title } });
    }
    await this.invalidate(projectId, task.id);
    return { success: true };
  }

  async assignTask(projectId: string, taskId: string, actorId: string, assigneeId: string | null) {
    const { project, membership } = await this.projectService.requireProjectMembership(projectId, actorId);
    if (!['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }

    const task = await this.requireTaskInProject(projectId, taskId);
    if (assigneeId === null) {
      const updated = await this.taskRepository.updateAssignee(task.id, null);
      if (this.activityLogService) {
        await this.activityLogService.record({ teamId: project.teamId, userId: actorId, entityType: 'TASK', entityId: task.id, action: 'UNASSIGNED', metadata: null });
      }
      await this.invalidate(projectId, task.id);
      return updated;
    }

    const assignee = await this.userRepository.findById(assigneeId);
    if (!assignee) {
      throw new AppError('Assignee not found', 404);
    }

    const assigneeMembership = await this.teamRepository.findMembership(project.teamId, assigneeId);
    if (!assigneeMembership) {
      throw new AppError('Assignee must be a member of this team', 400);
    }

    const updated = await this.taskRepository.updateAssignee(task.id, assigneeId);
    if (this.activityLogService) {
      await this.activityLogService.record({ teamId: project.teamId, userId: actorId, entityType: 'TASK', entityId: task.id, action: 'ASSIGNED', metadata: { assigneeId } });
    }
    if (this.notificationService) {
      await this.notificationService.notify({ recipientId: assigneeId, actorId, type: 'TASK_ASSIGNED', entityType: 'TASK', entityId: task.id });
    }
    await this.invalidate(projectId, task.id);
    return updated;
  }

  private async requireTaskInProject(projectId: string, taskId: string) {
    const task = await this.taskRepository.findById(taskId);
    if (!task || task.projectId !== projectId) {
      throw new AppError('Task not found', 404);
    }
    return task;
  }

  private async invalidate(projectId: string, taskId: string): Promise<void> {
    await this.cache?.delete(`task:${taskId}`, `tasks:project:${projectId}`);
  }
}
