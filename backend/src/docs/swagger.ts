import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TeamFlow API',
      version: '1.0.0',
      description: 'Project management API documentation',
    },
    servers: [{ url: '/api/v1' }],
  },
  apis: [path.join(__dirname, '../routes/**/*.ts')],
};

export const swaggerSpec = swaggerJSDoc(options);
