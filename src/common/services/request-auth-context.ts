import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { OidcBffService, UserPrincipal } from '../../proxy/auth/services/oidc-bff.service';

export interface RequestAuthState {
  authorization?: string;
  user?: UserPrincipal;
}

export const requestAuthContext = new AsyncLocalStorage<RequestAuthState>();

@Injectable()
export class GatewaySessionMiddleware implements NestMiddleware {
  constructor(private readonly oidcBff: OidcBffService) {}

  async use(request: any, _response: any, next: () => void): Promise<void> {
    const identity = await this.oidcBff.getRequestIdentity(request.headers.cookie);
    request.user = identity.user;
    requestAuthContext.run(identity, next);
  }
}
