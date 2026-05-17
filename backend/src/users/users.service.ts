import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, type Prisma } from '@prisma/client';
import { AchievementsService } from '../achievements/achievements.service';
import { ShopService } from '../shop/shop.service';
import { rolesMatchingSearch } from '../common/role-search';

export type UserRoleLocal =
  | 'CANDIDATE'
  | 'FIGHTER'
  | 'COMMANDER'
  | 'COMMANDANT'
  | 'EXTERNAL_COMMISSAR'
  | 'INTERNAL_COMMISSAR'
  | 'METHODIST'
  | 'PRESS_CENTER_HEAD'
  | 'COMSOSTAV';
export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private achievementsService: AchievementsService,
    private shopService: ShopService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        background: true,
        equippedBadges: { include: { item: true } },
        catConfig: true,
        achievements: { include: { achievement: true } },
        purchases: { include: { item: true } },
        attendances: {
          where: { confirmedAt: { not: null } },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                dateLabel: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { confirmedAt: 'desc' },
          take: 20,
        },
        organizedEvents: {
          select: {
            id: true,
            title: true,
            dateLabel: true,
            imageUrl: true,
            status: true,
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: { select: { attendances: true, organizedEvents: true } },
      },
    });
  }

  async findByVkId(vkId: number) {
    return this.prisma.user.findUnique({ where: { vkId } });
  }

  async create(data: {
    vkId: number;
    fullName: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    coins?: number;
    avatarUrl?: string | null;
    backgroundId?: string | null;
    orbitAchievementIds?: string[];
  }) {
    const dup = await this.prisma.user.findUnique({
      where: { vkId: data.vkId },
    });
    if (dup) throw new ConflictException('Пользователь с таким VK ID уже есть');

    const coins =
      typeof data.coins === 'number' &&
      Number.isFinite(data.coins) &&
      data.coins >= 0
        ? Math.floor(data.coins)
        : 0;

    const created = await this.prisma.user.create({
      data: {
        vkId: data.vkId,
        fullName: data.fullName.trim(),
        firstName: (data.firstName ?? '').trim(),
        lastName: (data.lastName ?? '').trim(),
        role: data.role ?? UserRole.CANDIDATE,
        coins,
        avatarUrl: data.avatarUrl ?? null,
        backgroundId: data.backgroundId ?? null,
        orbitAchievementIds: data.orbitAchievementIds ?? [],
      },
      include: {
        background: true,
        _count: { select: { attendances: true } },
      },
    });
    await this.shopService.ensureStarterCatSkinIfNoSkinsOwned(created.id);
    return created;
  }

  async updateRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as UserRole },
    });
  }

  async addCoins(
    userId: string,
    amount: number,
    reason: string,
    senderId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: amount } },
      });

      await tx.coinTransaction.create({
        data: {
          receiverId: userId,
          senderId: senderId || null,
          amount,
          reason,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: `Начислено ${amount} монет!`,
          message: reason,
        },
      });

      await this.achievementsService.evaluateAchievementsForUser(userId, tx);

      return user;
    });
  }

  async update(id: string, updateData: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { background: true },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  async getAll(search?: string) {
    const q = search?.trim();
    const include = {
      _count: { select: { attendances: true } },
    } as const;

    if (!q) {
      return this.prisma.user.findMany({
        orderBy: { coins: 'desc' },
        include,
        take: 50,
      });
    }

    if (/^\d+$/.test(q)) {
      const candidates = await this.prisma.user.findMany({
        orderBy: { coins: 'desc' },
        include,
        take: 300,
      });
      return candidates.filter((u) => String(u.vkId).includes(q)).slice(0, 50);
    }

    const roleMatches = rolesMatchingSearch(q);
    const nameOr: Prisma.UserWhereInput[] = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
    ];
    if (roleMatches.length > 0) {
      nameOr.push({ role: { in: roleMatches } });
    }

    const parts = q.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      return this.prisma.user.findMany({
        where: {
          AND: parts.map((part) => ({
            OR: [
              { fullName: { contains: part, mode: 'insensitive' } },
              { firstName: { contains: part, mode: 'insensitive' } },
              { lastName: { contains: part, mode: 'insensitive' } },
            ],
          })),
        },
        orderBy: { coins: 'desc' },
        include,
        take: 50,
      });
    }

    return this.prisma.user.findMany({
      where: { OR: nameOr },
      orderBy: { coins: 'desc' },
      include,
      take: 50,
    });
  }
}
