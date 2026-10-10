import { Body, Controller, Get, Headers, Post, Query, Res, UnauthorizedException } from '@nestjs/common';
import { OidcBffService } from '../services/oidc-bff.service';

interface FastifyReplyLike {
  code(statusCode: number): FastifyReplyLike;
  header(name: string, value: string | string[]): FastifyReplyLike;
  send(payload?: unknown): unknown;
}

@Controller('api/auth')
export class AuthProxyController {
  constructor(private readonly oidcBff: OidcBffService) {}

  @Get('login')
  async login(
    @Headers('x-forwarded-host') forwardedHost: string | undefined,
    @Headers('host') host: string | undefined,
    @Query('redirect') redirect: string | undefined,
    @Res() reply: FastifyReplyLike,
  ): Promise<void> {
    const login = await this.oidcBff.beginLogin(forwardedHost ?? host, redirect);
    this.redirect(reply, login.url, [login.flowCookie]);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res() reply: FastifyReplyLike,
  ): Promise<void> {
    if (!code || !state) throw new UnauthorizedException('Missing OIDC callback parameters');
    const flowCookieName = this.oidcBff.flowCookieName(state);
    const result = await this.oidcBff.completeLogin(code, state, this.readCookie(cookieHeader, flowCookieName));
    this.redirect(reply, result.redirectUrl, [result.sessionCookie, this.clearCookie(flowCookieName)]);
  }

  @Get('session')
  async session(
    @Headers('cookie') cookieHeader: string | undefined,
    @Res() reply: FastifyReplyLike,
  ): Promise<void> {
    reply.header('Cache-Control', 'no-store').header('Pragma', 'no-cache').code(200).send(
      await this.oidcBff.getSession(cookieHeader),
    );
  }

  @Get('logout')
  async logoutGet(
    @Headers('cookie') cookieHeader: string | undefined,
    @Res() reply: FastifyReplyLike,
  ): Promise<void> {
    await this.logout(cookieHeader, reply);
  }

  @Post('logout')
  async logoutPost(
    @Headers('cookie') cookieHeader: string | undefined,
    @Res() reply: FastifyReplyLike,
  ): Promise<void> {
    await this.logout(cookieHeader, reply);
  }

  @Post('backchannel-logout')
  async backchannelLogout(
    @Body() body: Record<string, unknown>,
    @Res() reply: FastifyReplyLike,
  ): Promise<void> {
    await this.oidcBff.processBackchannelLogout(body);
    reply.code(204).send();
  }

  private async logout(cookieHeader: string | undefined, reply: FastifyReplyLike): Promise<void> {
    const result = await this.oidcBff.logout(cookieHeader);
    this.redirect(reply, result.redirectUrl, [result.clearSessionCookie]);
  }

  private redirect(reply: FastifyReplyLike, location: string, cookies: string[]): void {
    reply
      .header('Cache-Control', 'no-store')
      .header('Pragma', 'no-cache')
      .header('Set-Cookie', cookies)
      .code(302)
      .header('Location', location)
      .send();
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

  private clearCookie(name: string): string {
    return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  }
}
