import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  async getBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { item: true },
      orderBy: { position: 'asc' },
    });
  }

  async equipBadge(userId: string, itemId: string, position: number) {
    const owned = await this.prisma.userShopItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (!owned) throw new ForbiddenException('Item not owned');

    return this.prisma.userBadge.upsert({
      where: { userId_itemId: { userId, itemId } },
      update: { position },
      create: { userId, itemId, position },
      include: { item: true },
    });
  }

  async unequipBadge(userId: string, itemId: string) {
    return this.prisma.userBadge.deleteMany({
      where: { userId, itemId },
    });
  }
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
