import type { TeamMembership, TeamRepository, TeamRole } from '../repositories/teamRepository.js';
import { AppError } from '../errors/appError.js';
import type { Cache } from './cacheService.js';

export class TeamService {
  constructor(private readonly teamRepository: TeamRepository, private readonly cache?: Cache) {}

  async createTeam(input: { name: string; description?: string | null; creatorId: string }) {
    if (!input.name?.trim()) {
      throw new AppError('Team name is required', 400);
    }

    const team = await this.teamRepository.create({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      creatorId: input.creatorId,
    });
    await this.cache?.delete(`teams:user:${input.creatorId}`);
    return team;
  }

  async getTeamsForUser(userId: string) {
    const key = `teams:user:${userId}`;
    const cached = await this.cache?.get<Awaited<ReturnType<TeamRepository['findManyByUser']>>>(key);
    if (cached) return cached;
    const teams = await this.teamRepository.findManyByUser(userId);
    await this.cache?.set(key, teams);
    return teams;
  }

  async getTeamById(id: string, userId: string) {
    await this.requireMembership(id, userId);
    const key = `team:${id}`;
    const cached = await this.cache?.get<NonNullable<Awaited<ReturnType<TeamRepository['findById']>>>>(key);
    if (cached) return cached;
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }
    await this.cache?.set(key, team);
    return team;
  }

  async updateTeam(id: string, userId: string, input: { name?: string; description?: string | null }) {
    await this.requireRole(id, userId, ['OWNER', 'ADMIN']);
    const existing = await this.teamRepository.findById(id);
    if (!existing) {
      throw new AppError('Team not found', 404);
    }

    const payload = {
      ...(input.name !== undefined ? { name: input.name.trim() || existing.name } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
    };

    const team = await this.teamRepository.update(id, payload);
    await this.invalidate(id);
    return team;
  }

  async deleteTeam(id: string, userId: string) {
    await this.requireRole(id, userId, ['OWNER']);
    const existing = await this.teamRepository.findById(id);
    if (!existing) {
      throw new AppError('Team not found', 404);
    }

    await this.teamRepository.delete(id);
    await this.invalidate(id);
    return { success: true };
  }

  async getMembership(teamId: string, userId: string): Promise<TeamMembership | null> {
    return this.teamRepository.findMembership(teamId, userId);
  }

  async inviteMember(teamId: string, actorId: string, userId: string) {
    if (!userId?.trim()) {
      throw new AppError('User ID is required', 400);
    }
    await this.requireRole(teamId, actorId, ['OWNER', 'ADMIN']);
    const existing = await this.teamRepository.findMembership(teamId, userId);
    if (existing) {
      throw new AppError('User is already a team member', 409);
    }

    const member = await this.teamRepository.addMember({ teamId, userId, role: 'MEMBER' });
    await this.invalidate(teamId);
    return member;
  }

  async removeMember(teamId: string, actorId: string, userId: string) {
    const actor = await this.requireRole(teamId, actorId, ['OWNER', 'ADMIN']);
    const target = await this.requireMembership(teamId, userId);

    if (actor.role === 'ADMIN' && target.role !== 'MEMBER') {
      throw new AppError('Admins can only remove members', 403);
    }

    await this.teamRepository.removeMember(teamId, userId);
    await this.invalidate(teamId);
    return { success: true };
  }

  async changeRole(teamId: string, actorId: string, userId: string, role: TeamRole) {
    if (!['OWNER', 'ADMIN', 'MEMBER'].includes(role)) {
      throw new AppError('Invalid team role', 400);
    }
    await this.requireRole(teamId, actorId, ['OWNER']);
    await this.requireMembership(teamId, userId);

    const member = await this.teamRepository.updateRole(teamId, userId, role);
    await this.invalidate(teamId);
    return member;
  }

  async listMembers(teamId: string, userId: string) {
    await this.requireMembership(teamId, userId);
    return this.teamRepository.listMembers(teamId);
  }

  async requireMembership(teamId: string, userId: string): Promise<TeamMembership> {
    const membership = await this.teamRepository.findMembership(teamId, userId);
    if (!membership) {
      throw new AppError('You are not a member of this team', 403);
    }
    return membership;
  }

  async requireRole(teamId: string, userId: string, roles: TeamRole[]): Promise<TeamMembership> {
    const membership = await this.requireMembership(teamId, userId);
    if (!roles.includes(membership.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    return membership;
  }

  private async invalidate(teamId: string): Promise<void> {
    await this.cache?.delete(`team:${teamId}`);
    await this.cache?.clear('teams:user:*');
  }
}
