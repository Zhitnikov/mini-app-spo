import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UserRole } from '@prisma/client';

export type UserRoleLocal = 'CANDIDATE' | 'FIGHTER' | 'COMMANDER' | 'COMMANDANT' | 'EXTERNAL_COMMISSAR' | 'INTERNAL_COMMISSAR' | 'METHODIST' | 'PRESS_CENTER_HEAD' | 'COMSOSTAV';
export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
          include: { event: { select: { id: true, title: true, dateLabel: true, imageUrl: true } } },
          orderBy: { confirmedAt: 'desc' },
          take: 20,
        },
        organizedEvents: {
          select: { id: true, title: true, dateLabel: true, imageUrl: true, status: true },
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

  async updateRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as UserRole },
    });
  }

  async addCoins(userId: string, amount: number, reason: string, senderId?: string) {
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

      return user;
    });
  }

  async update(id: string, updateData: any) {
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { background: true },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async createNotification(data: { userId: string, title: string, message: string }) {
    return this.prisma.notification.create({ data });
  }

  async getAll() {
    return this.prisma.user.findMany({
      orderBy: { coins: 'desc' },
      include: {
        _count: { select: { attendances: true } },
      },
    });
  }
}
