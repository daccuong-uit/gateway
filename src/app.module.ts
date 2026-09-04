import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthProxyModule } from './auth-proxy/auth-proxy.module';
import { IdentityProxyModule } from './identity-proxy/identity-proxy.module';
import { MediaProxyModule } from './media-proxy/media-proxy.module';
import { SocialProxyModule } from './social-proxy/social-proxy.module';
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
