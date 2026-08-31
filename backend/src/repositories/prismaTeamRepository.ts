import { PrismaClient } from '@prisma/client';
import type { TeamMembership, TeamRepository, TeamRecord, TeamRole } from './teamRepository.js';

export class PrismaTeamRepository implements TeamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { name: string; description?: string | null; creatorId: string }): Promise<TeamRecord> {
    const team = await this.prisma.team.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        members: {
          create: {
            userId: input.creatorId,
            role: 'OWNER',
          },
        },
      },
    });

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      deletedAt: team.deletedAt,
    };
  }

  async findManyByUser(userId: string): Promise<TeamRecord[]> {
    const rows = await this.prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((team: { id: string; name: string; description: string | null; createdAt: Date; updatedAt: Date; deletedAt: Date | null; }) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      deletedAt: team.deletedAt,
    }));
  }

  async findById(id: string): Promise<TeamRecord | null> {
    const team = await this.prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return null;
    }

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      deletedAt: team.deletedAt,
    };
  }

  async update(id: string, input: { name?: string; description?: string | null }): Promise<TeamRecord> {
    const team = await this.prisma.team.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
      },
    });

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      deletedAt: team.deletedAt,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.team.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async addMember(input: { teamId: string; userId: string; role?: TeamRole }): Promise<TeamMembership> {
    const member = await this.prisma.teamMember.create({
      data: { teamId: input.teamId, userId: input.userId, role: input.role ?? 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return this.toMembership(member);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId } } });
  }

  async findMembership(teamId: string, userId: string): Promise<TeamMembership | null> {
    const member = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return member ? this.toMembership(member) : null;
  }

  async listMembers(teamId: string): Promise<TeamMembership[]> {
    const members = await this.prisma.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((member: { userId: string; teamId: string; role: TeamRole; createdAt: Date; updatedAt: Date; user?: { id: string; name: string; email: string; } }) => this.toMembership(member));
  }

  async updateRole(teamId: string, userId: string, role: TeamRole): Promise<TeamMembership> {
    const member = await this.prisma.teamMember.update({
      where: { userId_teamId: { userId, teamId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return this.toMembership(member);
  }

  private toMembership(member: {
    userId: string;
    teamId: string;
    role: TeamRole;
    createdAt: Date;
    updatedAt: Date;
    user?: { id: string; name: string; email: string };
  }): TeamMembership {
    return {
      userId: member.userId,
      teamId: member.teamId,
      role: member.role,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      ...(member.user ? { user: member.user } : {}),
    };
  }
}
