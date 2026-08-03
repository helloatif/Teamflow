export interface CommentRecord {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentRepository {
  create(input: { taskId: string; authorId: string; content: string }): Promise<CommentRecord>;
  findById(id: string): Promise<CommentRecord | null>;
  findByTask(taskId: string): Promise<CommentRecord[]>;
  update(id: string, content: string): Promise<CommentRecord>;
  delete(id: string): Promise<void>;
}
