import type { PrismaClient } from '@prisma/client';
import type { ProjectRecord, ProjectRepository, ProjectStatus } from './projectRepository.js';

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { name: string; description?: string | null; teamId: string; status?: ProjectStatus }): Promise<ProjectRecord> {
    const project = await this.prisma.project.create({
      data: { name: input.name, description: input.description ?? null, teamId: input.teamId, status: input.status ?? 'ACTIVE' },
    });
    return this.toRecord(project);
  }

  async findById(id: string): Promise<ProjectRecord | null> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    return project ? this.toRecord(project) : null;
  }

  async findByTeam(teamId: string): Promise<ProjectRecord[]> {
    const projects = await this.prisma.project.findMany({ where: { teamId }, orderBy: { createdAt: 'desc' } });
    return projects.map((project: { id: string; name: string; description: string | null; status: ProjectStatus; teamId: string; createdAt: Date; updatedAt: Date; }) => this.toRecord(project));
  }

  async update(id: string, input: { name?: string; description?: string | null; status?: ProjectStatus }): Promise<ProjectRecord> {
    const project = await this.prisma.project.update({ where: { id }, data: input });
    return this.toRecord(project);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    return (await this.prisma.project.count({ where: { id } })) > 0;
  }

  private toRecord(project: {
    id: string; name: string; description: string | null; status: ProjectStatus; teamId: string; createdAt: Date; updatedAt: Date;
  }): ProjectRecord {
    return project;
  }
}
