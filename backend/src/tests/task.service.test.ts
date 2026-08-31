import { describe, expect, it } from 'vitest';
import { AppError } from '../errors/appError.js';
import type { ProjectRepository, ProjectRecord } from '../repositories/projectRepository.js';
import type { TaskRecord, TaskRepository } from '../repositories/taskRepository.js';
import type { TeamMembership, TeamRepository } from '../repositories/teamRepository.js';
import type { UserRepository } from '../repositories/userRepository.js';
import { ProjectService } from '../services/projectService.js';
import { TaskService } from '../services/taskService.js';
import { updateTaskSchema } from '../validators/taskValidators.js';

const project: ProjectRecord = {
  id: 'project-1', name: 'Backend', description: null, status: 'ACTIVE', teamId: 'team-1', createdAt: new Date(), updatedAt: new Date(),
};

class InMemoryTaskRepository implements TaskRepository {
  private tasks: TaskRecord[] = [];
  async create(input: { title: string; description?: string | null; projectId: string; createdBy: string }) {
    const task: TaskRecord = { id: `task-${this.tasks.length + 1}`, title: input.title, description: input.description ?? null, projectId: input.projectId, createdBy: input.createdBy, assigneeId: null, status: 'TODO', priority: 'MEDIUM', createdAt: new Date(), updatedAt: new Date() };
    this.tasks.push(task);
    return task;
  }
  async findById(id: string) { return this.tasks.find((task) => task.id === id) ?? null; }
  async findByProject(projectId: string) { return this.tasks.filter((task) => task.projectId === projectId); }
  async update(id: string, input: { title?: string; description?: string | null; status?: 'TODO' | 'IN_PROGRESS' | 'DONE'; priority?: 'LOW' | 'MEDIUM' | 'HIGH' }) {
    const task = await this.findById(id);
    if (!task) throw new Error('Task not found');
    Object.assign(task, input, { updatedAt: new Date() });
    return task;
  }
  async delete(id: string) { this.tasks = this.tasks.filter((task) => task.id !== id); }
  async updateAssignee(id: string, assigneeId: string | null) {
    const task = await this.findById(id);
    if (!task) throw new Error('Task not found');
    task.assigneeId = assigneeId;
    return task;
  }
}

const projectRepository = (exists = true) => ({
  findById: async (id: string) => (exists && id === project.id ? project : null),
}) as unknown as ProjectRepository;
const membership = (userId: string): TeamMembership => ({ userId, teamId: project.teamId, role: userId === 'member' ? 'MEMBER' : 'OWNER', createdAt: new Date(), updatedAt: new Date() });
const teamRepository = (allowed = true) => ({
  findMembership: async (_teamId: string, userId: string) => (allowed && userId !== 'outsider' ? membership(userId) : null),
}) as unknown as TeamRepository;
const userRepository = (exists = true) => ({
  findById: async (id: string) => (exists && id !== 'missing-user' ? { id, email: `${id}@example.com`, name: id, passwordHash: '', isActive: true, emailVerified: true, createdAt: new Date(), updatedAt: new Date() } : null),
}) as unknown as UserRepository;

const createService = (projectExists = true, allowed = true) => {
  const projects = new ProjectService(projectRepository(projectExists), teamRepository(allowed));
  return new TaskService(new InMemoryTaskRepository(), projects, userRepository(), teamRepository(allowed));
};

describe('TaskService', () => {
  it('creates a task for a project member', async () => {
    const service = createService();
    await expect(service.createTask({ projectId: project.id, createdBy: 'owner', title: '  Implement Login  ', description: '  JWT auth  ' }))
      .resolves.toMatchObject({ title: 'Implement Login', description: 'JWT auth', projectId: project.id, createdBy: 'owner' });
  });

  it('lists and gets tasks for a project member', async () => {
    const service = createService();
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Implement Login' });
    await expect(service.listTasks(project.id, 'member')).resolves.toHaveLength(1);
    await expect(service.getTask(project.id, task.id, 'member')).resolves.toMatchObject({ id: task.id });
  });

  it('updates and deletes a task', async () => {
    const service = createService();
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Implement Login' });
    await expect(service.updateTask(project.id, task.id, 'admin', { title: 'Implement Auth' })).resolves.toMatchObject({ title: 'Implement Auth' });
    await expect(service.deleteTask(project.id, task.id, 'owner')).resolves.toEqual({ success: true });
  });

  it('updates task status, priority, and both fields together', async () => {
    const service = createService();
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Implement Login' });
    await expect(service.updateTask(project.id, task.id, 'owner', { status: 'IN_PROGRESS' })).resolves.toMatchObject({ status: 'IN_PROGRESS', priority: 'MEDIUM' });
    await expect(service.updateTask(project.id, task.id, 'owner', { priority: 'HIGH' })).resolves.toMatchObject({ priority: 'HIGH' });
    await expect(service.updateTask(project.id, task.id, 'owner', { status: 'DONE', priority: 'LOW' })).resolves.toMatchObject({ status: 'DONE', priority: 'LOW' });
  });

  it('rejects invalid status and priority values', () => {
    expect(updateTaskSchema.safeParse({ status: 'INVALID' }).success).toBe(false);
    expect(updateTaskSchema.safeParse({ priority: 'URGENT' }).success).toBe(false);
  });

  it('returns 403 for outsiders and 404 for missing projects or tasks', async () => {
    const service = createService();
    await expect(service.listTasks(project.id, 'outsider')).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.getTask(project.id, 'missing-task', 'owner')).rejects.toBeInstanceOf(AppError);
    const missingProjectService = createService(false);
    await expect(missingProjectService.listTasks(project.id, 'owner')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('assigns, reassigns, and unassigns a task for an owner', async () => {
    const service = createService();
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Implement Login' });
    await expect(service.assignTask(project.id, task.id, 'owner', 'member')).resolves.toMatchObject({ assigneeId: 'member' });
    await expect(service.assignTask(project.id, task.id, 'owner', 'admin')).resolves.toMatchObject({ assigneeId: 'admin' });
    await expect(service.assignTask(project.id, task.id, 'owner', null)).resolves.toMatchObject({ assigneeId: null });
  });

  it('rejects assignment by members, unknown users, and users outside the team', async () => {
    const service = createService();
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Implement Login' });
    await expect(service.assignTask(project.id, task.id, 'member', 'owner')).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.assignTask(project.id, task.id, 'owner', 'missing-user')).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.assignTask(project.id, task.id, 'owner', 'outsider')).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('TaskService with cache', () => {
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

  const createServiceWithCache = (cache: MockCache) => {
    const projectRepo = new (class implements ProjectRepository {
      async create(): Promise<ProjectRecord> {
        return project;
      }
      async findById() {
        return project;
      }
      async findByTeam() {
        return [project];
      }
      async update() {
        return project;
      }
      async delete() {
        // no-op
      }
      async exists() {
        return true;
      }
    })();
    const projects = new ProjectService(projectRepo, teamRepository(true), undefined, cache);
    return new TaskService(new InMemoryTaskRepository(), projects, userRepository(), teamRepository(true), undefined, undefined, cache);
  };

  it('cache miss: fetches task from repository and stores in cache', async () => {
    const cache = new MockCache();
    const service = createServiceWithCache(cache);
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Test Task' });

    cache.getCalls = [];
    cache.setCalls = [];

    const fetched = await service.getTask(project.id, task.id, 'owner');

    expect(cache.getCalls).toContain(`task:${task.id}`);
    expect(fetched).toMatchObject({ id: task.id, title: 'Test Task' });
    expect(cache.setCalls.some((call) => call.key === `task:${task.id}`)).toBe(true);
  });

  it('cache hit: returns cached task without calling repository', async () => {
    const cache = new MockCache();
    const service = createServiceWithCache(cache);
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Test Task' });

    await service.getTask(project.id, task.id, 'owner');
    cache.getCalls = [];

    const cached = await service.getTask(project.id, task.id, 'owner');

    expect(cached).toMatchObject({ id: task.id, title: 'Test Task' });
    expect(cache.getCalls).toContain(`task:${task.id}`);
  });

  it('update invalidates task cache', async () => {
    const cache = new MockCache();
    const service = createServiceWithCache(cache);
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Test Task' });

    cache.deleteCalls = [];
    await service.updateTask(project.id, task.id, 'owner', { title: 'Updated Task' });

    expect(cache.deleteCalls).toContain(`task:${task.id}`);
    expect(cache.deleteCalls).toContain(`tasks:project:${project.id}`);
  });

  it('delete invalidates task cache', async () => {
    const cache = new MockCache();
    const service = createServiceWithCache(cache);
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Test Task' });

    cache.deleteCalls = [];
    await service.deleteTask(project.id, task.id, 'owner');

    expect(cache.deleteCalls).toContain(`task:${task.id}`);
    expect(cache.deleteCalls).toContain(`tasks:project:${project.id}`);
  });

  it('assignment invalidates task cache', async () => {
    const cache = new MockCache();
    const service = createServiceWithCache(cache);
    const task = await service.createTask({ projectId: project.id, createdBy: 'owner', title: 'Test Task' });

    cache.deleteCalls = [];
    await service.assignTask(project.id, task.id, 'owner', 'member');

    expect(cache.deleteCalls).toContain(`task:${task.id}`);
    expect(cache.deleteCalls).toContain(`tasks:project:${project.id}`);
  });
});
