import { Module } from '@nestjs/common';
import { AuthProxyController } from './controllers/auth-proxy.controller';
import { OidcBffService } from './services/oidc-bff.service';

@Module({
  controllers: [AuthProxyController],
  providers: [OidcBffService],
  exports: [OidcBffService],
})
export class AuthProxyModule {}
