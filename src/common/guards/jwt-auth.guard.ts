import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, AuthErrorCode } from '@platform/auth-sdk';
import { appConfig } from '../../config/app.config';

const jwtService = new JwtService({
  accessTokenSecret: appConfig.JWT_ACCESS_SECRET,
  refreshTokenSecret: '', // Gateway only verifies access tokens
});

/**
 * JWT Guard — verifies the Bearer token on every protected route.
 * On success, attaches the decoded payload to `request.user`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(AuthErrorCode.INVALID_TOKEN);
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = jwtService.verifyAccessToken(token);
      request.user = payload; // Attach to request for downstream handlers
      return true;
    } catch {
      throw new UnauthorizedException(AuthErrorCode.EXPIRED_TOKEN);
    }
  }
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = jwtService.verifyAccessToken(token);
      request.user = payload;
    } catch {
      // Ignore invalid or expired tokens for optional auth
    }

    return true;
  }
}
