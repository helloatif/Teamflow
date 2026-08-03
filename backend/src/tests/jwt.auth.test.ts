import { describe, expect, it } from 'vitest';
import { AuthService } from '../services/authService.js';

class InMemoryUserRepository {
  private users: Array<{ id: string; email: string; name: string; passwordHash: string; isActive: boolean; emailVerified: boolean; createdAt: Date; updatedAt: Date }> = [];

  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async create(user: { id: string; email: string; name: string; passwordHash: string; isActive: boolean; emailVerified: boolean; createdAt: Date; updatedAt: Date }) {
    this.users.push(user);
    return user;
  }

  async incrementRefreshTokenVersion(_userId: string): Promise<void> {
    // no-op for unit tests
  }
}

describe('JWT auth flow', () => {
  it('issues access and refresh tokens on registration', async () => {
    const service = new AuthService(new InMemoryUserRepository() as never);

    const result = await service.register({
      name: 'Atif',
      email: 'jwt@example.com',
      password: 'Password123!',
    });

    expect(result.accessToken).toBeTypeOf('string');
    expect(result.refreshToken).toBeTypeOf('string');
  });
});
