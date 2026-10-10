import 'dotenv/config';
import { loadConfig, BaseEnvSchema } from '@daccuong-uit/platform-config';
import { z } from 'zod';

const GatewayEnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().default(3000), // Override default if needed, but we'll use GATEWAY_PORT
  GATEWAY_PORT: z.coerce.number().default(3000),
  REDIS_URL: z.string().url().default('redis://:redis_password@localhost:6379'),
  KEYCLOAK_PUBLIC_URL: z.string().url().default('http://localhost:8080'),
  KEYCLOAK_INTERNAL_URL: z.string().url().default('http://localhost:8080'),
  KEYCLOAK_REALM: z.string().default('reals'),
  GATEWAY_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  SESSION_TTL_SECONDS: z.coerce.number().int().min(300).default(604800),
  OIDC_CLIENT_ID_GATEWAY: z.string().default('gateway-bff'),
  OIDC_CLIENT_ID_IAM: z.string().default('iam-web'),
  OIDC_CLIENT_ID_SOCIAL: z.string().default('social-web'),
  OIDC_CLIENT_ID_VIDEO: z.string().default('video-web'),
  OIDC_CLIENT_ID_SHOP: z.string().default('shop-web'),
  OIDC_CLIENT_ID_STORIES: z.string().default('stories-web'),
  OIDC_CLIENT_ID_PORTFOLIO: z.string().default('portfolio-web'),
  GATEWAY_APP_HOST: z.string().default('localhost:3000'),
  IAM_APP_HOST: z.string().default('localhost:4200'),
  SOCIAL_APP_HOST: z.string().default('localhost:4201'),
  VIDEO_APP_HOST: z.string().default('localhost:4202'),
  SHOP_APP_HOST: z.string().default('localhost:4203'),
  STORIES_APP_HOST: z.string().default('localhost:4204'),
  PORTFOLIO_APP_HOST: z.string().default('localhost:4205'),
  IAM_APP_ORIGIN: z.string().url().default('http://localhost:4200'),
  SOCIAL_APP_ORIGIN: z.string().url().default('http://localhost:4201'),
  VIDEO_APP_ORIGIN: z.string().url().default('http://localhost:4202'),
  SHOP_APP_ORIGIN: z.string().url().default('http://localhost:4203'),
  STORIES_APP_ORIGIN: z.string().url().default('http://localhost:4204'),
  PORTFOLIO_APP_ORIGIN: z.string().url().default('http://localhost:4205'),
  IAM_SERVICE_URL: z.string().url().default('http://localhost:3001/api/v1'),
  SOCIAL_SERVICE_URL: z.string().url().default('http://localhost:3002/api/v1'),
  MEDIA_SERVICE_URL: z.string().url().default('http://localhost:3003/api/v1'),
  STORIES_SERVICE_URL: z.string().url().default('http://localhost:3004/api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_LIMIT: z.coerce.number().default(100),
}).transform((data) => ({
  ...data,
  PORT: data.GATEWAY_PORT || data.PORT,
}));

export const appConfig = loadConfig(GatewayEnvSchema);
export type AppConfig = typeof appConfig;
