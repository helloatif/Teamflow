import { AppError } from '../errors/appError.js';
import type { ProjectRepository, ProjectStatus } from '../repositories/projectRepository.js';
import type { TeamRepository } from '../repositories/teamRepository.js';
import type { ActivityLogService } from './activityLogService.js';

export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly teamRepository: TeamRepository,
    private readonly activityLogService?: ActivityLogService
  ) {}

  async createProject(input: { teamId: string; name: string; description?: string | null; actorId?: string }) {
    await this.requireTeam(input.teamId);
    const project = await this.projectRepository.create({
      teamId: input.teamId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    });
    if (this.activityLogService && input.actorId) {
      await this.activityLogService.record({ teamId: input.teamId, userId: input.actorId, entityType: 'PROJECT', entityId: project.id, action: 'CREATED', metadata: { name: project.name } });
    }
    return project;
  }

  async getProject(teamId: string, projectId: string) {
    await this.requireTeam(teamId);
    return this.requireProjectInTeam(teamId, projectId);
  }

  async listProjects(teamId: string) {
    await this.requireTeam(teamId);
    return this.projectRepository.findByTeam(teamId);
  }

  async updateProject(
    teamId: string,
    projectId: string,
    input: { name?: string; description?: string | null; status?: ProjectStatus }
  ) {
    const project = await this.requireProjectInTeam(teamId, projectId);
    return this.projectRepository.update(project.id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });
  }

  async deleteProject(teamId: string, projectId: string, actorId?: string) {
    const project = await this.requireProjectInTeam(teamId, projectId);
    await this.projectRepository.delete(project.id);
    if (this.activityLogService && actorId) {
      await this.activityLogService.record({ teamId, userId: actorId, entityType: 'PROJECT', entityId: project.id, action: 'DELETED', metadata: { name: project.name } });
    }
    return { success: true };
  }

  async requireProjectMembership(projectId: string, userId: string) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const membership = await this.teamRepository.findMembership(project.teamId, userId);
    if (!membership) {
      throw new AppError('You are not a member of this team', 403);
    }

    return { project, membership };
  }

  private async requireTeam(teamId: string) {
    const team = await this.teamRepository.findById(teamId);
    if (!team || team.deletedAt) {
      throw new AppError('Team not found', 404);
    }
    return team;
  }

  private async requireProjectInTeam(teamId: string, projectId: string) {
    const project = await this.projectRepository.findById(projectId);
    if (!project || project.teamId !== teamId) {
      throw new AppError('Project not found', 404);
    }
    return project;
  }
}
