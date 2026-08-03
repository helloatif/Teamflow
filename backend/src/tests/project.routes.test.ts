import { describe, expect, it } from 'vitest';
import { createProjectsRouter } from '../routes/projects.js';

describe('Projects routes', () => {
  it('creates the projects router without connecting to the database', () => {
    expect(createProjectsRouter()).toBeDefined();
  });
});
