import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, ShopItemType, type CatWearSlot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from '../achievements/achievements.service';

export interface CatWearLayoutInput {
  anchorX: number;
  anchorY: number;
  widthPercent: number;
  zIndex: number;
  rotationDeg?: number;
}

export interface CreateShopItemInput {
  type: ShopItemType;
  name: string;
  description?: string;
  price: number | string;
  icon?: string | null;
  imageUrl?: string | null;
  requiresFighter?: boolean;
  catWearSlot?: CatWearSlot | null;
  catWearLayout?: CatWearLayoutInput | null;
  catSkinLottieUrl?: string | null;
}

export type UpdateShopItemInput = Partial<
  Omit<CreateShopItemInput, 'price'> & { price?: number | string }
>;

@Injectable()
export class ShopService {
  constructor(
    private prisma: PrismaService,
    private achievementsService: AchievementsService,
  ) {}

  static readonly DEFAULT_CAT_SKIN_ID = 'cat_skin_default';

  async getCatConfig(userId: string) {
    const config = await this.prisma.catConfig.findUnique({
      where: { userId },
    });

    const ownedCatItems = await this.prisma.userShopItem.findMany({
      where: { userId, item: { type: 'CAT_ITEM' } },
      include: { item: true },
    });

    const ownedCatSkins = await this.prisma.userShopItem.findMany({
      where: { userId, item: { type: 'CAT_SKIN' } },
      include: { item: true },
    });

    return { config, ownedCatItems, ownedCatSkins };
  }

  private async assertUserOwnsSkin(userId: string, skinId: string) {
    if (skinId === ShopService.DEFAULT_CAT_SKIN_ID) return;
    const row = await this.prisma.userShopItem.findUnique({
      where: { userId_itemId: { userId, itemId: skinId } },
      include: { item: true },
    });
    if (!row || row.item.type !== 'CAT_SKIN') {
      throw new BadRequestException('Этот скин не куплен');
    }
  }

  async updateCatConfig(
    userId: string,
    dto: {
      equippedItems: string[];
      equippedCatSkinId?: string;
      skinLoadouts?: Record<string, string[]>;
    },
  ) {
    const prev = await this.prisma.catConfig.findUnique({
      where: { userId },
    });
    const nextSkin =
      dto.equippedCatSkinId ??
      prev?.equippedCatSkinId ??
      ShopService.DEFAULT_CAT_SKIN_ID;

    await this.assertUserOwnsSkin(userId, nextSkin);

    const prevLoadouts =
      (prev?.skinLoadouts as Record<string, string[]> | null | undefined) ?? {};
    const nextLoadouts =
      dto.skinLoadouts != null
        ? { ...dto.skinLoadouts }
        : { ...prevLoadouts, [nextSkin]: dto.equippedItems };

    const config = await this.prisma.catConfig.upsert({
      where: { userId },
      update: {
        equippedItems: dto.equippedItems,
        equippedCatSkinId: nextSkin,
        skinLoadouts: nextLoadouts as unknown as Prisma.InputJsonValue,
      },
      create: {
        userId,
        equippedItems: dto.equippedItems,
        equippedCatSkinId: nextSkin,
        skinLoadouts: nextLoadouts as unknown as Prisma.InputJsonValue,
      },
    });

    await this.achievementsService.evaluateAchievementsForUser(userId);

    return config;
  }

  async createShopItem(data: CreateShopItemInput) {
    const {
      type,
      name,
      description,
      price,
      icon,
      imageUrl,
      requiresFighter,
      catWearSlot,
      catWearLayout,
      catSkinLottieUrl,
    } = data;
    const isCatWear = type === 'CAT_ITEM';
    const isCatSkin = type === 'CAT_SKIN';
    if (isCatWear && !catWearSlot) {
      throw new BadRequestException(
        'Для предмета кота укажите слот одежды (catWearSlot)',
      );
    }
    if (isCatSkin && !catSkinLottieUrl?.trim()) {
      throw new BadRequestException(
        'Для скина кота укажите catSkinLottieUrl (путь к JSON Lottie)',
      );
    }
    return this.prisma.shopItem.create({
      data: {
        type,
        name,
        description: description ?? '',
        price: typeof price === 'string' ? parseInt(price, 10) : price,
        icon: icon ?? null,
        imageUrl: imageUrl ?? null,
        requiresFighter: !!requiresFighter,
        catWearSlot: isCatWear ? catWearSlot ?? null : null,
        catWearLayout: isCatWear
          ? catWearLayout != null
            ? (catWearLayout as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull
          : Prisma.DbNull,
        catSkinLottieUrl: isCatSkin ? (catSkinLottieUrl ?? null) : null,
      },
    });
  }

  async updateShopItem(id: string, data: UpdateShopItemInput) {
    const existing = await this.prisma.shopItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Предмет не найден');

    const nextType = data.type ?? existing.type;
    const isCatWear = nextType === 'CAT_ITEM';
    const isCatSkin = nextType === 'CAT_SKIN';
    const effectiveSlot = data.catWearSlot ?? existing.catWearSlot;
    if (isCatWear && !effectiveSlot) {
      throw new BadRequestException(
        'Для предмета кота укажите слот одежды (catWearSlot)',
      );
    }

    const patch: Prisma.ShopItemUpdateInput = {};

    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.price !== undefined) {
      patch.price =
        typeof data.price === 'string'
          ? parseInt(data.price, 10)
          : data.price;
    }
    if (data.icon !== undefined) patch.icon = data.icon;
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
    if (data.requiresFighter !== undefined)
      patch.requiresFighter = data.requiresFighter;
    if (data.type !== undefined) patch.type = data.type;

    if (data.catWearSlot !== undefined) patch.catWearSlot = data.catWearSlot;
    if (data.catWearLayout !== undefined) {
      patch.catWearLayout =
        data.catWearLayout === null
          ? Prisma.DbNull
          : (data.catWearLayout as unknown as Prisma.InputJsonValue);
    }
    if (data.catSkinLottieUrl !== undefined)
      patch.catSkinLottieUrl = data.catSkinLottieUrl;

    if (isCatSkin) {
      patch.catWearSlot = null;
      patch.catWearLayout = Prisma.DbNull;
    } else if (!isCatWear) {
      patch.catWearSlot = null;
      patch.catWearLayout = Prisma.DbNull;
      patch.catSkinLottieUrl = null;
    }

    return this.prisma.shopItem.update({
      where: { id },
      data: patch,
    });
  }

  async getAllItems(type?: string) {
    const itemType = this.parseShopItemType(type);
    return this.prisma.shopItem.findMany({
      where: itemType ? { type: itemType } : {},
      orderBy: { price: 'asc' },
    });
  }

  private parseShopItemType(
    type: string | undefined,
  ): ShopItemType | undefined {
    if (!type) return undefined;
    const values = Object.values(ShopItemType) as string[];
    return values.includes(type) ? (type as ShopItemType) : undefined;
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

      await this.achievementsService.evaluateAchievementsForUser(userId, tx);

      return { user: updatedUser, purchase };
    });
  }
}
