import { describe, expect, it } from 'vitest';
import { createTasksRouter } from '../routes/tasks.js';

describe('Task routes', () => {
  it('creates the task router without connecting to the database', () => {
    expect(createTasksRouter()).toBeDefined();
  });
});
