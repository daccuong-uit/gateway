import { AsyncLocalStorage } from 'node:async_hooks';
import { UserPrincipal } from '../../proxy/auth/services/oidc-bff.service';

export interface RequestAuthState {
  authorization?: string;
  user?: UserPrincipal;
}

export const requestAuthContext = new AsyncLocalStorage<RequestAuthState>();
