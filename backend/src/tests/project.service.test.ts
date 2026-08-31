import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/appError.js';
import type { ProjectRecord, ProjectRepository, ProjectStatus } from '../repositories/projectRepository.js';
import type { TeamRecord, TeamRepository } from '../repositories/teamRepository.js';
import { ProjectService } from '../services/projectService.js';

class InMemoryProjectRepository implements ProjectRepository {
  private projects: ProjectRecord[] = [];

  async create(input: { name: string; description?: string | null; teamId: string; status?: ProjectStatus }) {
    const project: ProjectRecord = {
      id: `project-${this.projects.length + 1}`,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? 'ACTIVE',
      teamId: input.teamId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.push(project);
    return project;
  }

  async findById(id: string) { return this.projects.find((project) => project.id === id) ?? null; }
  async findByTeam(teamId: string) { return this.projects.filter((project) => project.teamId === teamId); }
  async update(id: string, input: { name?: string; description?: string | null; status?: ProjectStatus }) {
    const project = await this.findById(id);
    if (!project) throw new Error('Project not found');
    Object.assign(project, input, { updatedAt: new Date() });
    return project;
  }
  async delete(id: string) { this.projects = this.projects.filter((project) => project.id !== id); }
  async exists(id: string) { return (await this.findById(id)) !== null; }
}

const team: TeamRecord = {
  id: 'team-1', name: 'Platform', description: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
};
const teamRepository = (exists = true) => ({
  findById: async (id: string) => (exists && id === team.id ? team : null),
}) as unknown as TeamRepository;

describe('ProjectService', () => {
  it('creates a project for an existing team', async () => {
    const service = new ProjectService(new InMemoryProjectRepository(), teamRepository());
    await expect(service.createProject({ teamId: team.id, name: '  Backend API  ', description: '  Main work  ' }))
      .resolves.toMatchObject({ name: 'Backend API', description: 'Main work', status: 'ACTIVE', teamId: team.id });
  });

  it('lists and gets projects only within their team', async () => {
    const service = new ProjectService(new InMemoryProjectRepository(), teamRepository());
    const project = await service.createProject({ teamId: team.id, name: 'Backend API' });
    await expect(service.listProjects(team.id)).resolves.toHaveLength(1);
    await expect(service.getProject(team.id, project.id)).resolves.toMatchObject({ id: project.id });
    await expect(service.getProject('other-team', project.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('updates a project and supports archiving it', async () => {
    const service = new ProjectService(new InMemoryProjectRepository(), teamRepository());
    const project = await service.createProject({ teamId: team.id, name: 'Backend API' });
    await expect(service.updateProject(team.id, project.id, { name: 'Services', status: 'ARCHIVED' }))
      .resolves.toMatchObject({ name: 'Services', status: 'ARCHIVED' });
  });

  it('deletes a project', async () => {
    const service = new ProjectService(new InMemoryProjectRepository(), teamRepository());
    const project = await service.createProject({ teamId: team.id, name: 'Backend API' });
    await expect(service.deleteProject(team.id, project.id)).resolves.toEqual({ success: true });
    await expect(service.getProject(team.id, project.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 404 for a missing project or team', async () => {
    const service = new ProjectService(new InMemoryProjectRepository(), teamRepository(false));
    await expect(service.createProject({ teamId: team.id, name: 'Backend API' })).rejects.toBeInstanceOf(AppError);
    await expect(service.listProjects(team.id)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ProjectService with cache', () => {
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
    const service = new ProjectService(new InMemoryProjectRepository(), teamRepository(), undefined, cache);
    const project = await service.createProject({ teamId: team.id, name: 'Backend API' });

    cache.getCalls = [];
    cache.setCalls = [];

    const fetched = await service.getProject(team.id, project.id);

    expect(cache.getCalls).toContain(`project:${project.id}`);
    expect(fetched).toMatchObject({ id: project.id, name: 'Backend API' });
    expect(cache.setCalls.some((call) => call.key === `project:${project.id}`)).toBe(true);
  });

  it('cache hit: returns cached project without calling repository', async () => {
    const cache = new MockCache();
    const service = new ProjectService(new InMemoryProjectRepository(), teamRepository(), undefined, cache);
    const project = await service.createProject({ teamId: team.id, name: 'Backend API' });

    await service.getProject(team.id, project.id);
    cache.getCalls = [];

    const cached = await service.getProject(team.id, project.id);

    expect(cached).toMatchObject({ id: project.id, name: 'Backend API' });
    expect(cache.getCalls).toContain(`project:${project.id}`);
  });

  it('update invalidates project cache', async () => {
    const cache = new MockCache();
    const service = new ProjectService(new InMemoryProjectRepository(), teamRepository(), undefined, cache);
    const project = await service.createProject({ teamId: team.id, name: 'Backend API' });

    cache.deleteCalls = [];
    await service.updateProject(team.id, project.id, { name: 'Services' });

    expect(cache.deleteCalls).toContain(`project:${project.id}`);
    expect(cache.deleteCalls).toContain(`projects:team:${team.id}`);
  });

  it('delete invalidates project cache', async () => {
    const cache = new MockCache();
    const service = new ProjectService(new InMemoryProjectRepository(), teamRepository(), undefined, cache);
    const project = await service.createProject({ teamId: team.id, name: 'Backend API' });

    cache.deleteCalls = [];
    await service.deleteProject(team.id, project.id);

    expect(cache.deleteCalls).toContain(`project:${project.id}`);
    expect(cache.deleteCalls).toContain(`projects:team:${team.id}`);
  });
});
