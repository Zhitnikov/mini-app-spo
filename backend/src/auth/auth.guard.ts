import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { jwtVerify } from 'jose';
import type { SessionJwtPayload } from '../common/types/session-jwt';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_change_me',
);

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as
      | Record<string, string | undefined>
      | undefined;
    const token = cookies?.['spo_session'];

    if (typeof token !== 'string') {
      throw new UnauthorizedException('No session token');
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      request.user = payload as SessionJwtPayload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
