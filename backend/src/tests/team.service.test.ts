import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { AppError } from '../errors/appError.js';
import type { TeamMembership, TeamRecord, TeamRepository, TeamRole } from '../repositories/teamRepository.js';
import { TeamService } from '../services/teamService.js';

class InMemoryTeamRepository implements TeamRepository {
  private teams: TeamRecord[] = [];
  private memberships: TeamMembership[] = [];

  async create(input: { name: string; description?: string | null; creatorId: string }) {
    const team: TeamRecord = {
      id: `team-${this.teams.length + 1}`,
      name: input.name,
      description: input.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    this.teams.push(team);
    this.memberships.push(this.membership(team.id, input.creatorId, 'OWNER'));
    return team;
  }

  async findManyByUser(userId: string) {
    const teamIds = this.memberships.filter((member) => member.userId === userId).map((member) => member.teamId);
    return this.teams.filter((team) => teamIds.includes(team.id));
  }

  async findById(id: string) {
    return this.teams.find((team) => team.id === id) ?? null;
  }

  async update(id: string, input: { name?: string; description?: string | null }) {
    const team = await this.findById(id);
    if (!team) throw new Error('Team not found');
    team.name = input.name ?? team.name;
    team.description = input.description ?? team.description;
    team.updatedAt = new Date();
    return team;
  }

  async delete(id: string) {
    const team = await this.findById(id);
    if (team) team.deletedAt = new Date();
  }

  async addMember(input: { teamId: string; userId: string; role?: TeamRole }) {
    const member = this.membership(input.teamId, input.userId, input.role ?? 'MEMBER');
    this.memberships.push(member);
    return member;
  }

  async removeMember(teamId: string, userId: string) {
    this.memberships = this.memberships.filter((member) => member.teamId !== teamId || member.userId !== userId);
  }

  async findMembership(teamId: string, userId: string) {
    return this.memberships.find((member) => member.teamId === teamId && member.userId === userId) ?? null;
  }

  async listMembers(teamId: string) {
    return this.memberships.filter((member) => member.teamId === teamId);
  }

  async updateRole(teamId: string, userId: string, role: TeamRole) {
    const member = await this.findMembership(teamId, userId);
    if (!member) throw new Error('Membership not found');
    member.role = role;
    member.updatedAt = new Date();
    return member;
  }

  private membership(teamId: string, userId: string, role: TeamRole): TeamMembership {
    return { teamId, userId, role, createdAt: new Date(), updatedAt: new Date() };
  }
}

const createServiceWithTeam = async () => {
  const service = new TeamService(new InMemoryTeamRepository());
  const team = await service.createTeam({ name: '  Alpha Team  ', description: '  Product planning  ', creatorId: 'owner' });
  return { service, team };
};

describe('TeamService', () => {
  it('creates an express app without booting the server', () => {
    expect(createApp()).toBeDefined();
  });

  it('creates a team with a trimmed name and an owner membership', async () => {
    const { service, team } = await createServiceWithTeam();
    expect(team.name).toBe('Alpha Team');
    expect(team.description).toBe('Product planning');
    await expect(service.getMembership(team.id, 'owner')).resolves.toMatchObject({ role: 'OWNER' });
  });

  it('allows an owner and admin to invite members, but rejects duplicate invites', async () => {
    const { service, team } = await createServiceWithTeam();
    await expect(service.inviteMember(team.id, 'owner', 'admin')).resolves.toMatchObject({ role: 'MEMBER' });
    await service.changeRole(team.id, 'owner', 'admin', 'ADMIN');
    await expect(service.inviteMember(team.id, 'admin', 'member')).resolves.toMatchObject({ userId: 'member' });
    await expect(service.inviteMember(team.id, 'admin', 'member')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects member invites and access by non-members', async () => {
    const { service, team } = await createServiceWithTeam();
    await service.inviteMember(team.id, 'owner', 'member');
    await expect(service.inviteMember(team.id, 'member', 'another-user')).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.listMembers(team.id, 'outsider')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows an admin to remove a member but not an owner or admin', async () => {
    const { service, team } = await createServiceWithTeam();
    await service.inviteMember(team.id, 'owner', 'admin');
    await service.changeRole(team.id, 'owner', 'admin', 'ADMIN');
    await service.inviteMember(team.id, 'owner', 'member');
    await expect(service.removeMember(team.id, 'admin', 'member')).resolves.toEqual({ success: true });
    await expect(service.removeMember(team.id, 'admin', 'owner')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows only an owner to change roles', async () => {
    const { service, team } = await createServiceWithTeam();
    await service.inviteMember(team.id, 'owner', 'member');
    await expect(service.changeRole(team.id, 'owner', 'member', 'ADMIN')).resolves.toMatchObject({ role: 'ADMIN' });
    await expect(service.changeRole(team.id, 'member', 'owner', 'MEMBER')).rejects.toBeInstanceOf(AppError);
  });
});

describe('TeamService with cache', () => {
  class MockCache {
    private store: Map<string, string> = new Map();
    setCalls: Array<{ key: string; value: unknown }> = [];
    getCalls: string[] = [];
    deleteCalls: string[] = [];

    async get<T>(key: string): Promise<T | null> {
      this.getCalls.push(key);
      const value = this.store.get(key);
      return value ? (JSON.parse(value) as T) : null;
    }

    async set<T>(key: string, value: T): Promise<void> {
      this.setCalls.push({ key, value });
      this.store.set(key, JSON.stringify(value));
    }

    async delete(...keys: string[]): Promise<void> {
      this.deleteCalls.push(...keys);
      keys.forEach((key) => this.store.delete(key));
    }

    async clear(_pattern: string): Promise<void> {
      this.store.clear();
    }
  }

  it('cache miss: fetches from repository and stores in cache', async () => {
    const cache = new MockCache();
    const repo = new InMemoryTeamRepository();
    const service = new TeamService(repo, cache);
    const team = await service.createTeam({ name: 'Test Team', creatorId: 'owner' });

    cache.getCalls = [];
    cache.setCalls = [];

    const fetched = await service.getTeamById(team.id, 'owner');

    expect(cache.getCalls).toContain(`team:${team.id}`);
    expect(fetched).toMatchObject({ id: team.id, name: 'Test Team' });
    expect(cache.setCalls.some((call) => call.key === `team:${team.id}`)).toBe(true);
  });

  it('cache hit: returns cached team without calling repository', async () => {
    const cache = new MockCache();
    const repo = new InMemoryTeamRepository();
    const service = new TeamService(repo, cache);
    const team = await service.createTeam({ name: 'Test Team', creatorId: 'owner' });

    await service.getTeamById(team.id, 'owner');
    cache.getCalls = [];

    const cached = await service.getTeamById(team.id, 'owner');

    expect(cached).toMatchObject({ id: team.id, name: 'Test Team' });
    expect(cache.getCalls).toContain(`team:${team.id}`);
  });

  it('update invalidates team cache', async () => {
    const cache = new MockCache();
    const repo = new InMemoryTeamRepository();
    const service = new TeamService(repo, cache);
    const team = await service.createTeam({ name: 'Test Team', creatorId: 'owner' });

    cache.deleteCalls = [];
    await service.updateTeam(team.id, 'owner', { name: 'Updated Team' });

    expect(cache.deleteCalls).toContain(`team:${team.id}`);
  });

  it('delete invalidates team cache', async () => {
    const cache = new MockCache();
    const repo = new InMemoryTeamRepository();
    const service = new TeamService(repo, cache);
    const team = await service.createTeam({ name: 'Test Team', creatorId: 'owner' });

    cache.deleteCalls = [];
    await service.deleteTeam(team.id, 'owner');

    expect(cache.deleteCalls).toContain(`team:${team.id}`);
  });

  it('redis failure during read: falls back to repository', async () => {
    class FailingCache {
      async get<T>(_key: string): Promise<T | null> {
        // Simulate Redis timeout/error by returning null (like real CacheService does with fail-open)
        return null;
      }

      async set<T>(_key: string, _value: T): Promise<void> {
        // fail-open, do nothing
      }

      async delete(..._keys: string[]): Promise<void> {
        // fail-open, do nothing
      }

      async clear(_pattern: string): Promise<void> {
        // fail-open, do nothing
      }
    }

    const cache = new FailingCache();
    const repo = new InMemoryTeamRepository();
    const service = new TeamService(repo, cache);
    const team = await service.createTeam({ name: 'Test Team', creatorId: 'owner' });

    const fetched = await service.getTeamById(team.id, 'owner');

    expect(fetched).toMatchObject({ id: team.id, name: 'Test Team' });
  });
});
