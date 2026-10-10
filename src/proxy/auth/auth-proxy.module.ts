import { Module } from '@nestjs/common';
import { AuthProxyController } from './controllers/auth-proxy.controller';
import { OidcBffService } from './services/oidc-bff.service';
import { GatewaySessionMiddleware } from '../../common/services/request-auth-context';

@Module({
  controllers: [AuthProxyController],
  providers: [OidcBffService, GatewaySessionMiddleware],
  exports: [GatewaySessionMiddleware],
})
export class AuthProxyModule {}
