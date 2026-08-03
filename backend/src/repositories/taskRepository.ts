export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  createdBy: string;
  assigneeId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRepository {
  create(input: { title: string; description?: string | null; projectId: string; createdBy: string }): Promise<TaskRecord>;
  findById(id: string): Promise<TaskRecord | null>;
  findByProject(projectId: string): Promise<TaskRecord[]>;
  update(id: string, input: { title?: string; description?: string | null; status?: TaskStatus; priority?: TaskPriority }): Promise<TaskRecord>;
  delete(id: string): Promise<void>;
  updateAssignee(id: string, assigneeId: string | null): Promise<TaskRecord>;
}
