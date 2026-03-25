import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_change_me',
);

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies['spo_session'];

    if (!token) {
      throw new UnauthorizedException('No session token');
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
