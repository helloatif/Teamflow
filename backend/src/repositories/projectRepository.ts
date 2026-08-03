export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectRepository {
  create(input: { name: string; description?: string | null; teamId: string; status?: ProjectStatus }): Promise<ProjectRecord>;
  findById(id: string): Promise<ProjectRecord | null>;
  findByTeam(teamId: string): Promise<ProjectRecord[]>;
  update(id: string, input: { name?: string; description?: string | null; status?: ProjectStatus }): Promise<ProjectRecord>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
