import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

type MetricKey =
  | 'shop_purchases'
  | 'cat_items_owned'
  | 'events_attended'
  | 'events_organized'
  | 'coins_balance';

interface ParsedCondition {
  metric: MetricKey;
  operator: 'gte';
  value: number;
}

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async getAllAchievements() {
    return this.prisma.achievement.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createAchievement(data: {
    name: string;
    description?: string;
    icon: string;
    condition?: string;
  }) {
    if (!data.name || !data.icon)
      throw new BadRequestException('Name and icon are required');
    return this.prisma.achievement.create({
      data: {
        name: data.name,
        description: data.description ?? '',
        icon: data.icon,
        condition: data.condition ?? '',
      },
    });
  }

  async evaluateAchievementsForUser(
    userId: string,
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const achievements = await db.achievement.findMany();
    if (!achievements.length) return [];

    const metrics = await this.collectUserMetrics(userId, db);
    const alreadyOwned = await db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const ownedIds = new Set(alreadyOwned.map((it) => it.achievementId));

    const newlyAssigned: string[] = [];

    for (const achievement of achievements) {
      if (ownedIds.has(achievement.id)) continue;
      const parsed = this.parseCondition(achievement.condition);
      if (!parsed) continue;
      const currentValue = metrics[parsed.metric];
      if (!this.matchesCondition(currentValue, parsed)) continue;

      await db.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      await db.notification.create({
        data: {
          userId,
          title: `Новое достижение: ${achievement.icon} ${achievement.name}!`,
          message: `Комсостав наградил вас достижением: ${achievement.description}`,
        },
      });
      newlyAssigned.push(achievement.id);
    }

    return newlyAssigned;
  }

  async assignAchievement(userId: string, achievementId: string) {
    const userAchievement = await this.prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      update: {},
      create: { userId, achievementId },
    });

    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });
    if (achievement) {
      await this.prisma.notification.create({
        data: {
          userId,
          title: `Новое достижение: ${achievement.icon} ${achievement.name}!`,
          message: `Комсостав наградил вас достижением: ${achievement.description}`,
        },
      });
    }

    return userAchievement;
  }

  private matchesCondition(value: number, condition: ParsedCondition): boolean {
    if (condition.operator === 'gte') return value >= condition.value;
    return false;
  }

  private async collectUserMetrics(
    userId: string,
    db: PrismaService | Prisma.TransactionClient,
  ): Promise<Record<MetricKey, number>> {
    const [purchasesTotal, catItemsOwned, attendedEvents, organizedEvents, user] =
      await Promise.all([
        db.userShopItem.count({ where: { userId } }),
        db.userShopItem.count({ where: { userId, item: { type: 'CAT_ITEM' } } }),
        db.eventAttendee.count({
          where: { userId, confirmedAt: { not: null } },
        }),
        db.event.count({ where: { organizerId: userId } }),
        db.user.findUnique({ where: { id: userId }, select: { coins: true } }),
      ]);

    return {
      shop_purchases: purchasesTotal,
      cat_items_owned: catItemsOwned,
      events_attended: attendedEvents,
      events_organized: organizedEvents,
      coins_balance: user?.coins ?? 0,
    };
  }

  private parseCondition(raw: string): ParsedCondition | null {
    const normalized = raw.trim();
    if (!normalized) return null;

    const auto = normalized.match(
      /^AUTO:([a-z_]+):(gte):(\d+)$/i,
    );
    if (auto) {
      const metric = auto[1].toLowerCase() as MetricKey;
      const operator = auto[2].toLowerCase() as 'gte';
      const value = Number(auto[3]);
      if (this.isMetric(metric) && Number.isFinite(value)) {
        return { metric, operator, value };
      }
      return null;
    }

    const text = normalized.toLowerCase();
    if (text.includes('купить') && text.includes('предмет') && text.includes('кот'))
      return { metric: 'cat_items_owned', operator: 'gte', value: 1 };

    const numberInText = this.extractFirstNumber(text);
    if (text.includes('куп') && text.includes('предмет') && numberInText != null) {
      return { metric: 'shop_purchases', operator: 'gte', value: numberInText };
    }
    if (
      text.includes('посет') &&
      text.includes('меропр') &&
      numberInText != null
    ) {
      return { metric: 'events_attended', operator: 'gte', value: numberInText };
    }
    if (
      text.includes('организ') &&
      text.includes('меропр') &&
      numberInText != null
    ) {
      return { metric: 'events_organized', operator: 'gte', value: numberInText };
    }
    if (
      (text.includes('монет') || text.includes('монеты')) &&
      numberInText != null
    ) {
      return { metric: 'coins_balance', operator: 'gte', value: numberInText };
    }

    return null;
  }

  private extractFirstNumber(text: string): number | null {
    const match = text.match(/\d+/);
    if (!match) return null;
    const value = Number(match[0]);
    return Number.isFinite(value) ? value : null;
  }

  private isMetric(metric: string): metric is MetricKey {
    return (
      metric === 'shop_purchases' ||
      metric === 'cat_items_owned' ||
      metric === 'events_attended' ||
      metric === 'events_organized' ||
      metric === 'coins_balance'
    );
  }
}
