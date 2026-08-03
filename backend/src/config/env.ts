import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const corsOriginSchema = z
  .string()
  .min(1, 'CORS_ORIGIN is required')
  .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
  .refine((origins) => origins.length > 0 && origins.every((origin) => z.string().url().safeParse(origin).success), {
    message: 'CORS_ORIGIN must contain one or more comma-separated valid URLs',
  });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  CORS_ORIGIN: corsOriginSchema,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  process.stderr.write(`Startup configuration error: ${details}\n`);
  throw new Error(`Invalid environment configuration: ${details}`);
}

const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGIN,
};

export default env;
