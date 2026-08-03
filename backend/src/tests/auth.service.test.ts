import { describe, expect, it } from 'vitest';
import { AuthService } from '../services/authService.js';
import { AppError } from '../errors/appError.js';

class InMemoryUserRepository {
  private users: Array<{ id: string; email: string; name: string; passwordHash: string }> = [];

  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async create(user: { id: string; email: string; name: string; passwordHash: string }) {
    this.users.push(user);
    return user;
  }
}

describe('AuthService', () => {
  it('registers a new user and hashes the password', async () => {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo as never);

    const result = await service.register({
      name: 'Atif',
      email: 'atif@example.com',
      password: 'Password123!',
    });

    expect(result.user.email).toBe('atif@example.com');
    expect(result.user.passwordHash).not.toBe('Password123!');
    expect(result.user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects login when the password is incorrect', async () => {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo as never);

    await service.register({
      name: 'Atif',
      email: 'atif@example.com',
      password: 'Password123!',
    });

    await expect(
      service.login({ email: 'atif@example.com', password: 'wrong-password' })
    ).rejects.toBeInstanceOf(AppError);
  });
});
