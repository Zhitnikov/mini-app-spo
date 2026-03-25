import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async getCatConfig(userId: string) {
    const config = await this.prisma.catConfig.findUnique({
      where: { userId },
    });

    const ownedCatItems = await this.prisma.userShopItem.findMany({
      where: { userId, item: { type: 'CAT_ITEM' } },
      include: { item: true },
    });

    return { config, ownedCatItems };
  }

  async updateCatConfig(userId: string, equippedItems: any) {
    const config = await this.prisma.catConfig.upsert({
      where: { userId },
      update: { equippedItems },
      create: { userId, equippedItems },
    });

    await this.prisma.userAchievement.upsert({
      where: {
        userId_achievementId: { userId, achievementId: 'ach_cat_lover' },
      },
      update: {},
      create: { userId, achievementId: 'ach_cat_lover' },
    });

    return config;
  }

  async createShopItem(data: any) {
    const { type, name, description, price, icon, imageUrl, requiresFighter } = data;
    return this.prisma.shopItem.create({
      data: {
        type,
        name,
        description: description || '',
        price: typeof price === 'string' ? parseInt(price) : price,
        icon: icon || null,
        imageUrl: imageUrl || null,
        requiresFighter: !!requiresFighter,
      },
    });
  }

  async getAllItems(type?: string) {
    return this.prisma.shopItem.findMany({
      where: type ? { type: type as any } : {},
      orderBy: { price: 'asc' },
    });
  }

  async buyItem(userId: string, itemId: string) {
    const [user, item] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.shopItem.findUnique({ where: { id: itemId } }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!item) throw new NotFoundException('Item not found');

    const fighterRoles = [
      'FIGHTER',
      'COMMANDER',
      'COMMANDANT',
      'EXTERNAL_COMMISSAR',
      'INTERNAL_COMMISSAR',
      'METHODIST',
      'PRESS_CENTER_HEAD',
      'COMSOSTAV',
    ];
    if (item.requiresFighter && !fighterRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Этот предмет доступен только для подтверждённых участников',
      );
    }

    const alreadyOwned = await this.prisma.userShopItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (alreadyOwned) throw new BadRequestException('Предмет уже куплен');

    if (user.coins < item.price) {
      throw new BadRequestException('Недостаточно монет');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { coins: { decrement: item.price } },
      });

      const purchase = await tx.userShopItem.create({
        data: { userId, itemId },
        include: { item: true },
      });

      if (item.type === 'BACKGROUND') {
        await tx.user.update({
          where: { id: userId },
          data: { backgroundId: itemId },
        });
      }

      const purchaseCount = await tx.userShopItem.count({ where: { userId } });
      if (purchaseCount >= 3) {
        await tx.userAchievement.upsert({
          where: {
            userId_achievementId: { userId, achievementId: 'ach_shopper' },
          },
          update: {},
          create: { userId, achievementId: 'ach_shopper' },
        });
      }

      return { user: updatedUser, purchase };
    });
  }
}
