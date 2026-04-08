import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { jwtVerify } from 'jose';
import type { SessionJwtPayload } from '../common/types/session-jwt';
import { PrismaService } from '../prisma/prisma.service';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_change_me',
);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

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
      const session = payload as SessionJwtPayload;
      const row = await this.prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, vkId: true, role: true },
      });
      if (!row) {
        throw new UnauthorizedException('User not found');
      }
      if (row.vkId !== session.vkId) {
        throw new UnauthorizedException('Invalid session');
      }
      request.user = {
        ...session,
        role: row.role,
        vkId: row.vkId,
      };
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
