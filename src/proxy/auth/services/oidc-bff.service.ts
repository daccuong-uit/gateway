import { createHash, randomBytes } from 'node:crypto';
import { Injectable, OnModuleDestroy, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { fetch, Response as UndiciResponse } from 'undici';
import Redis from 'ioredis';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { appConfig } from '../../../config/app.config';

const SESSION_COOKIE = '__Host-session';
const FLOW_COOKIE_PREFIX = '__Host-oidc-';
const LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout';
const SESSION_KEY_PREFIX = 'bff:session:';
const USER_SESSIONS_KEY_PREFIX = 'bff:user-sessions:';
const IDP_SESSIONS_KEY_PREFIX = 'bff:idp-sessions:';
const LOGIN_KEY_PREFIX = 'bff:login:';
const LOGIN_TTL_SECONDS = 300;
const SESSION_REFRESH_WINDOW_MS = 30_000;

export interface UserPrincipal {
  sub: string;
  email: string;
  username: string;
  name?: string;
  roles: string[];
}

interface ClientRegistration {
  clientId: string;
  host: string;
  appOrigin: string;
  callbackUri: string;
}

interface PendingLogin {
  clientId: string;
  appOrigin: string;
  callbackUri: string;
  redirectPath: string;
  codeVerifier: string;
  nonce: string;
  flowId: string;
}

interface SessionRecord {
  clientId: string;
  appOrigin: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
  oidcSub: string;
  oidcSid?: string;
  user: UserPrincipal;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  error?: string;
}

@Injectable()
export class OidcBffService implements OnModuleInit, OnModuleDestroy {
  private readonly redis = new Redis(appConfig.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 });
  private readonly issuer = `${appConfig.KEYCLOAK_PUBLIC_URL}/realms/${appConfig.KEYCLOAK_REALM}`;
  private readonly internalRealmUrl = `${appConfig.KEYCLOAK_INTERNAL_URL}/realms/${appConfig.KEYCLOAK_REALM}`;
  private readonly jwks = createRemoteJWKSet(new URL(`${this.internalRealmUrl}/protocol/openid-connect/certs`));
  private readonly clients: ClientRegistration[] = [
    { clientId: appConfig.OIDC_CLIENT_ID_IAM, host: appConfig.IAM_APP_HOST, appOrigin: appConfig.IAM_APP_ORIGIN, callbackUri: `${appConfig.IAM_APP_ORIGIN}/api/auth/callback` },
    { clientId: appConfig.OIDC_CLIENT_ID_SOCIAL, host: appConfig.SOCIAL_APP_HOST, appOrigin: appConfig.SOCIAL_APP_ORIGIN, callbackUri: `${appConfig.SOCIAL_APP_ORIGIN}/api/auth/callback` },
    { clientId: appConfig.OIDC_CLIENT_ID_VIDEO, host: appConfig.VIDEO_APP_HOST, appOrigin: appConfig.VIDEO_APP_ORIGIN, callbackUri: `${appConfig.VIDEO_APP_ORIGIN}/api/auth/callback` },
    { clientId: appConfig.OIDC_CLIENT_ID_SHOP, host: appConfig.SHOP_APP_HOST, appOrigin: appConfig.SHOP_APP_ORIGIN, callbackUri: `${appConfig.SHOP_APP_ORIGIN}/api/auth/callback` },
    { clientId: appConfig.OIDC_CLIENT_ID_STORIES, host: appConfig.STORIES_APP_HOST, appOrigin: appConfig.STORIES_APP_ORIGIN, callbackUri: `${appConfig.STORIES_APP_ORIGIN}/api/auth/callback` },
    { clientId: appConfig.OIDC_CLIENT_ID_PORTFOLIO, host: appConfig.PORTFOLIO_APP_HOST, appOrigin: appConfig.PORTFOLIO_APP_ORIGIN, callbackUri: `${appConfig.PORTFOLIO_APP_ORIGIN}/api/auth/callback` },
    { clientId: appConfig.OIDC_CLIENT_ID_GATEWAY, host: appConfig.GATEWAY_APP_HOST, appOrigin: appConfig.IAM_APP_ORIGIN, callbackUri: `${appConfig.GATEWAY_PUBLIC_URL}/api/auth/callback` },
  ];

  async onModuleInit(): Promise<void> {
    await this.redis.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  async beginLogin(host: string | undefined, redirect: string | undefined): Promise<{ url: string; flowCookie: string }> {
    const registration = this.resolveClient(host);
    const state = this.randomToken();
    const nonce = this.randomToken();
    const flowId = this.randomToken();
    const codeVerifier = this.randomToken(48);
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const redirectPath = this.safeRedirectPath(redirect);
    const pending: PendingLogin = {
      clientId: registration.clientId,
      appOrigin: registration.appOrigin,
      callbackUri: registration.callbackUri,
      redirectPath,
      codeVerifier,
      nonce,
      flowId,
    };

    await this.redis.set(`${LOGIN_KEY_PREFIX}${state}`, JSON.stringify(pending), 'EX', LOGIN_TTL_SECONDS);

    const authorizeUrl = new URL(`${appConfig.KEYCLOAK_PUBLIC_URL}/realms/${appConfig.KEYCLOAK_REALM}/protocol/openid-connect/auth`);
    authorizeUrl.search = new URLSearchParams({
      client_id: registration.clientId,
      response_type: 'code',
      scope: 'openid profile email',
      redirect_uri: registration.callbackUri,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }).toString();

    return { url: authorizeUrl.toString(), flowCookie: this.cookie(this.flowCookieName(state), flowId, LOGIN_TTL_SECONDS) };
  }

  async completeLogin(code: string, state: string, flowId: string | undefined): Promise<{ redirectUrl: string; sessionCookie: string }> {
    if (!/^[A-Za-z0-9_-]{43}$/.test(state)) throw new UnauthorizedException('Invalid OIDC login state');
    const pendingJson = await this.redis.get(`${LOGIN_KEY_PREFIX}${state}`);
    if (!pendingJson || !flowId) throw new UnauthorizedException('Invalid OIDC login state');

    const pending = JSON.parse(pendingJson) as PendingLogin;
    if (pending.flowId !== flowId) throw new UnauthorizedException('OIDC login state mismatch');
    await this.redis.del(`${LOGIN_KEY_PREFIX}${state}`);

    const response = await fetch(`${this.internalRealmUrl}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: pending.clientId,
        code,
        redirect_uri: pending.callbackUri,
        code_verifier: pending.codeVerifier,
      }),
    });
    const tokenSet = await this.readTokenResponse(response);
    if (!tokenSet.id_token || !tokenSet.access_token || !tokenSet.refresh_token) {
      throw new UnauthorizedException('Keycloak did not return a complete token set');
    }

    const { payload } = await jwtVerify(tokenSet.id_token, this.jwks, {
      issuer: this.issuer,
      audience: pending.clientId,
      requiredClaims: ['sub', 'nonce', 'exp', 'iat'],
    });
    if (payload.nonce !== pending.nonce || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Invalid OIDC identity token');
    }

    const sid = typeof payload.sid === 'string' ? payload.sid : undefined;
    const user = this.toUserPrincipal(payload);
    const sessionId = this.randomToken(32);
    const record: SessionRecord = {
      clientId: pending.clientId,
      appOrigin: pending.appOrigin,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      idToken: tokenSet.id_token,
      expiresAt: Date.now() + (tokenSet.expires_in ?? 300) * 1000,
      oidcSub: payload.sub,
      oidcSid: sid,
      user,
    };

    await this.storeSession(sessionId, record);
    const redirectUrl = new URL(pending.redirectPath, pending.appOrigin).toString();
    return { redirectUrl, sessionCookie: this.cookie(SESSION_COOKIE, sessionId, appConfig.SESSION_TTL_SECONDS) };
  }

  async getSession(cookieHeader: string | undefined): Promise<{ isAuthenticated: boolean; user: UserPrincipal | null }> {
    const session = await this.getSessionRecord(cookieHeader);
    return { isAuthenticated: Boolean(session), user: session?.user ?? null };
  }

  async getRequestIdentity(cookieHeader: string | undefined): Promise<{ authorization?: string; user?: UserPrincipal }> {
    const session = await this.getSessionRecord(cookieHeader);
    if (!session) return {};
    return { authorization: `Bearer ${session.accessToken}`, user: session.user };
  }

  async logout(cookieHeader: string | undefined): Promise<{ redirectUrl: string; clearSessionCookie: string }> {
    const sessionId = this.readCookie(cookieHeader, SESSION_COOKIE);
    let record: SessionRecord | undefined;
    if (sessionId) {
      const sessionJson = await this.redis.get(`${SESSION_KEY_PREFIX}${sessionId}`);
      if (sessionJson) record = JSON.parse(sessionJson) as SessionRecord;
      if (record) await this.deleteSession(sessionId, record);
    }

    const clientId = record?.clientId ?? appConfig.OIDC_CLIENT_ID_GATEWAY;
    const postLogoutOrigin = record?.appOrigin ?? appConfig.IAM_APP_ORIGIN;
    const logoutUrl = new URL(`${appConfig.KEYCLOAK_PUBLIC_URL}/realms/${appConfig.KEYCLOAK_REALM}/protocol/openid-connect/logout`);
    logoutUrl.searchParams.set('client_id', clientId);
    logoutUrl.searchParams.set('post_logout_redirect_uri', new URL('/', postLogoutOrigin).toString());
    if (record?.idToken) logoutUrl.searchParams.set('id_token_hint', record.idToken);

    return {
      redirectUrl: logoutUrl.toString(),
      clearSessionCookie: this.clearCookie(SESSION_COOKIE),
    };
  }

  async processBackchannelLogout(body: Record<string, unknown>): Promise<void> {
    const logoutToken = typeof body.logout_token === 'string' ? body.logout_token : '';
    if (!logoutToken) throw new UnauthorizedException('Missing logout_token');

    const clientIds = this.clients.map((client) => client.clientId);
    const { payload } = await jwtVerify(logoutToken, this.jwks, {
      issuer: this.issuer,
      audience: clientIds,
      requiredClaims: ['iat', 'jti', 'iss', 'aud'],
    });
    const events = payload.events as Record<string, unknown> | undefined;
    if (payload.nonce !== undefined || !events || !(LOGOUT_EVENT in events)) {
      throw new UnauthorizedException('Invalid back-channel logout token');
    }

    const jti = typeof payload.jti === 'string' ? payload.jti : '';
    const isNewToken = await this.redis.set(`bff:logout-token:${jti}`, '1', 'EX', 600, 'NX');
    if (!isNewToken) throw new UnauthorizedException('Logout token already processed');

    const sid = typeof payload.sid === 'string' ? payload.sid : undefined;
    const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
    if (!sid && !sub) throw new UnauthorizedException('Logout token has no sid or sub');

    const indexKey = sid ? `${IDP_SESSIONS_KEY_PREFIX}${sid}` : `${USER_SESSIONS_KEY_PREFIX}${sub}`;
    const sessionIds = await this.redis.smembers(indexKey);
    for (const sessionId of sessionIds) {
      const sessionJson = await this.redis.get(`${SESSION_KEY_PREFIX}${sessionId}`);
      if (sessionJson) await this.deleteSession(sessionId, JSON.parse(sessionJson) as SessionRecord);
      else await this.redis.srem(indexKey, sessionId);
    }
  }

  private async getSessionRecord(cookieHeader: string | undefined): Promise<SessionRecord | undefined> {
    const sessionId = this.readCookie(cookieHeader, SESSION_COOKIE);
    if (!sessionId) return undefined;

    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    const sessionJson = await this.redis.get(sessionKey);
    if (!sessionJson) return undefined;

    let session = JSON.parse(sessionJson) as SessionRecord;
    if (session.expiresAt <= Date.now() + SESSION_REFRESH_WINDOW_MS) {
      const refreshed = await this.refreshSession(sessionId, session);
      if (!refreshed) return undefined;
      session = refreshed;
    }
    return session;
  }

  private async refreshSession(sessionId: string, session: SessionRecord): Promise<SessionRecord | undefined> {
    const response = await fetch(`${this.internalRealmUrl}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: session.clientId,
        refresh_token: session.refreshToken,
      }),
    });

    let tokenSet: TokenResponse;
    try {
      tokenSet = await this.readTokenResponse(response);
    } catch {
      await this.deleteSession(sessionId, session);
      return undefined;
    }
    if (!tokenSet.access_token) {
      await this.deleteSession(sessionId, session);
      return undefined;
    }

    session.accessToken = tokenSet.access_token;
    session.refreshToken = tokenSet.refresh_token ?? session.refreshToken;
    session.idToken = tokenSet.id_token ?? session.idToken;
    session.expiresAt = Date.now() + (tokenSet.expires_in ?? 300) * 1000;
    await this.storeSession(sessionId, session);
    return session;
  }

  private async readTokenResponse(response: UndiciResponse): Promise<TokenResponse> {
    const tokenSet = await response.json() as TokenResponse;
    if (!response.ok || tokenSet.error) throw new UnauthorizedException('Keycloak token exchange failed');
    return tokenSet;
  }

  private async storeSession(sessionId: string, session: SessionRecord): Promise<void> {
    const ttl = appConfig.SESSION_TTL_SECONDS;
    await this.redis.set(`${SESSION_KEY_PREFIX}${sessionId}`, JSON.stringify(session), 'EX', ttl);
    await this.redis.sadd(`${USER_SESSIONS_KEY_PREFIX}${session.oidcSub}`, sessionId);
    await this.redis.expire(`${USER_SESSIONS_KEY_PREFIX}${session.oidcSub}`, ttl);
    if (session.oidcSid) {
      await this.redis.sadd(`${IDP_SESSIONS_KEY_PREFIX}${session.oidcSid}`, sessionId);
      await this.redis.expire(`${IDP_SESSIONS_KEY_PREFIX}${session.oidcSid}`, ttl);
    }
  }

  private async deleteSession(sessionId: string, session: SessionRecord): Promise<void> {
    await this.redis.del(`${SESSION_KEY_PREFIX}${sessionId}`);
    const indexes = [
      `${USER_SESSIONS_KEY_PREFIX}${session.oidcSub}`,
      ...(session.oidcSid ? [`${IDP_SESSIONS_KEY_PREFIX}${session.oidcSid}`] : []),
    ];
    for (const index of indexes) {
      await this.redis.srem(index, sessionId);
      if (await this.redis.scard(index) === 0) await this.redis.del(index);
    }
  }

  private resolveClient(host: string | undefined): ClientRegistration {
    const normalizedHost = (host ?? '').split(',')[0].trim().toLowerCase();
    const registration = this.clients.find((client) => client.host.toLowerCase() === normalizedHost);
    if (!registration) throw new UnauthorizedException('Unknown frontend host');
    return registration;
  }

  private safeRedirectPath(value: string | undefined): string {
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
    try {
      const parsed = new URL(value, 'http://localhost');
      return parsed.origin === 'http://localhost' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '/';
    } catch {
      return '/';
    }
  }

  private toUserPrincipal(payload: JWTPayload): UserPrincipal {
    const realmRoles = (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
    const resourceAccess = payload.resource_access as Record<string, { roles?: string[] }> | undefined;
    const clientRoles = Object.values(resourceAccess ?? {}).flatMap((client) => client.roles ?? []);
    const email = typeof payload.email === 'string' ? payload.email : '';
    const username = typeof payload.preferred_username === 'string' ? payload.preferred_username : email;
    const name = typeof payload.name === 'string' ? payload.name : undefined;
    return {
      sub: payload.sub as string,
      email,
      username,
      ...(name ? { name } : {}),
      roles: [...new Set([...realmRoles, ...clientRoles])],
    };
  }

  private readCookie(header: string | undefined, name: string): string | undefined {
    const value = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    if (!value) return undefined;
    try {
      return decodeURIComponent(value.slice(name.length + 1));
    } catch {
      return undefined;
    }
  }

  private cookie(name: string, value: string, maxAge: number): string {
    return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
  }

  private clearCookie(name: string): string {
    return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  }

  flowCookieName(state: string): string {
    return `${FLOW_COOKIE_PREFIX}${state}`;
  }

  private randomToken(byteLength = 32): string {
    return randomBytes(byteLength).toString('base64url');
  }
}
