import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthProxyModule } from './proxy/auth/auth-proxy.module';
import { IdentityProxyModule } from './proxy/identity/identity-proxy.module';
import { MediaProxyModule } from './proxy/media/media-proxy.module';
import { SocialProxyModule } from './proxy/social/social-proxy.module';
import { HealthModule } from './health/health.module';
import { appConfig } from './config/app.config';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: appConfig.RATE_LIMIT_TTL * 1000,
        limit: appConfig.RATE_LIMIT_LIMIT,
      },
    ]),
    AuthProxyModule,
    IdentityProxyModule,
    MediaProxyModule,
    SocialProxyModule,
    HealthModule,
  ],
})
export class AppModule {}
