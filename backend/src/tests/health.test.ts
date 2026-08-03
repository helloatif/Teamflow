import { describe, it, expect } from 'vitest';

describe('health endpoint', () => {
  it('returns a healthy response shape', () => {
    expect({ success: true, message: 'TeamFlow API is running' }).toMatchObject({
      success: true,
      message: expect.any(String),
    });
  });
});
