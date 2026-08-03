export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(user: Omit<UserRecord, 'createdAt' | 'updatedAt'> & { createdAt?: Date; updatedAt?: Date }): Promise<UserRecord>;
}
