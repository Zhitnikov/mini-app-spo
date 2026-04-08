import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignJWT, jwtVerify } from 'jose';
import type { SessionJwtPayload } from '../common/types/session-jwt';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_change_me',
);

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /** VK id из `ADMIN_VK_IDS` (через запятую) — при каждом логине роль COMMANDER + монеты как у демо-админа. */
  private isEnvAdminVkId(vkId: number): boolean {
    const raw = process.env.ADMIN_VK_IDS ?? '';
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number.parseInt(s, 10))
      .filter((n) => !Number.isNaN(n));
    return ids.includes(vkId);
  }

  /**
   * Если пользователь в ADMIN_VK_IDS, поднимаем до COMMANDER и отдаём новый JWT
   * (иначе в cookie остаётся старая роль из токена).
   */
  async refreshSessionIfEnvAdmin(
    user: User,
  ): Promise<{ user: User; newToken?: string }> {
    if (!this.isEnvAdminVkId(user.vkId)) {
      return { user };
    }
    if (user.role === UserRole.COMMANDER && user.coins >= 1000) {
      return { user };
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        role: UserRole.COMMANDER,
        coins: { set: Math.max(user.coins, 1000) },
      },
    });
    const newToken = await this.signToken({
      userId: updated.id,
      vkId: updated.vkId,
      role: updated.role,
    });
    return { user: updated, newToken };
  }

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
    const isEnvAdmin = this.isEnvAdminVkId(vkId);
    const shouldBeCommander = isDevAdmin || isEnvAdmin;

    let user = await this.prisma.user.findUnique({ where: { vkId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          vkId,
          fullName: `${firstName} ${lastName}`.trim(),
          firstName: firstName || '',
          lastName: lastName || '',
          role: shouldBeCommander ? 'COMMANDER' : 'CANDIDATE',
          coins: shouldBeCommander ? 1000 : 0,
          avatarUrl: avatarUrl || null,
        },
      });
    } else if (shouldBeCommander) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'COMMANDER',
          coins: { set: Math.max(user.coins, 1000) },
          fullName: `${firstName} ${lastName}`.trim(),
          firstName: firstName || '',
          lastName: lastName || '',
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
