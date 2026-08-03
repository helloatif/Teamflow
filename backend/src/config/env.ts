import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

const env = {
  ...parsed.data,
  JWT_SECRET: parsed.data.JWT_SECRET ?? (parsed.data.NODE_ENV === 'production' ? undefined : 'dev-jwt-secret'),
  JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET ?? (parsed.data.NODE_ENV === 'production' ? undefined : 'dev-jwt-refresh-secret'),
};

export default env;
