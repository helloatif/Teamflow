export interface TeamRecord {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface TeamMembership {
  userId: string;
  teamId: string;
  role: TeamRole;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TeamRepository {
  create(input: { name: string; description?: string | null; creatorId: string }): Promise<TeamRecord>;
  findManyByUser(userId: string): Promise<TeamRecord[]>;
  findById(id: string): Promise<TeamRecord | null>;
  update(id: string, input: { name?: string; description?: string | null }): Promise<TeamRecord>;
  delete(id: string): Promise<void>;
  addMember(input: { teamId: string; userId: string; role?: TeamRole }): Promise<TeamMembership>;
  removeMember(teamId: string, userId: string): Promise<void>;
  findMembership(teamId: string, userId: string): Promise<TeamMembership | null>;
  listMembers(teamId: string): Promise<TeamMembership[]>;
  updateRole(teamId: string, userId: string, role: TeamRole): Promise<TeamMembership>;
}
