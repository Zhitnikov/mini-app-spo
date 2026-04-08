import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignJWT, jwtVerify } from 'jose';
import type { SessionJwtPayload } from '../common/types/session-jwt';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_change_me',
);

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signToken(
    payload: Omit<SessionJwtPayload, 'iat' | 'exp'>,
  ): Promise<string> {
    return await new SignJWT(payload as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
  }

  async verifyToken(token: string): Promise<SessionJwtPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as SessionJwtPayload;
    } catch {
      return null;
    }
  }

  async login(
    vkId: number,
    firstName: string,
    lastName: string,
    avatarUrl?: string,
  ) {
    const isDev = process.env.NODE_ENV === 'development';
    const isDevAdmin = vkId === 1 && isDev;

    let user = await this.prisma.user.findUnique({ where: { vkId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          vkId,
          fullName: `${firstName} ${lastName}`.trim(),
          firstName: firstName || '',
          lastName: lastName || '',
          role: isDevAdmin ? 'COMMANDER' : 'CANDIDATE',
          coins: isDevAdmin ? 1000 : 0,
          avatarUrl: avatarUrl || null,
        },
      });
    } else if (isDevAdmin) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'COMMANDER',
          coins: { set: Math.max(user.coins, 1000) },
          fullName: `${firstName} ${lastName}`.trim(),
          avatarUrl: avatarUrl || user.avatarUrl,
        },
      });
    }

    const token = await this.signToken({
      userId: user.id,
      vkId: user.vkId,
      role: user.role,
    });

    return { user, token };
  }
}
