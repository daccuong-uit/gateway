import 'dotenv/config';
import { loadConfig, BaseEnvSchema } from '@platform/config';
import { z } from 'zod';

const GatewayEnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().default(3000), // Override default if needed, but we'll use GATEWAY_PORT
  GATEWAY_PORT: z.coerce.number().default(3000),
  JWT_ACCESS_SECRET: z.string().min(32),
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001/api/v1'),
  IDENTITY_SERVICE_URL: z.string().url().default('http://localhost:3002/api/v1'),
  MEDIA_SERVICE_URL: z.string().url().default('http://localhost:3003/api/v1'),
  SOCIAL_SERVICE_URL: z.string().url().default('http://localhost:3004/api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_LIMIT: z.coerce.number().default(100),
}).transform((data) => ({
  ...data,
  PORT: data.GATEWAY_PORT || data.PORT,
}));

export const appConfig = loadConfig(GatewayEnvSchema);
export type AppConfig = typeof appConfig;
