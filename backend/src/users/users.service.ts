import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, type Prisma } from '@prisma/client';
import { AchievementsService } from '../achievements/achievements.service';

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
      typeof data.coins === 'number' && Number.isFinite(data.coins) && data.coins >= 0
        ? Math.floor(data.coins)
        : 0;

    return this.prisma.user.create({
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
    return this.prisma.user.findMany({
      where: q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { role: { equals: q as UserRole } },
            ],
          }
        : undefined,
      orderBy: { coins: 'desc' },
      include: {
        _count: { select: { attendances: true } },
      },
      take: 50,
    });
  }
}
