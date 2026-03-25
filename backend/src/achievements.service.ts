import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async getAllAchievements() {
    return this.prisma.achievement.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createAchievement(data: { name: string, description?: string, icon: string, condition?: string }) {
    if (!data.name || !data.icon) throw new BadRequestException('Name and icon are required');
    return this.prisma.achievement.create({
      data: { 
        name: data.name, 
        description: data.description || '', 
        icon: data.icon, 
        condition: data.condition || '' 
      },
    });
  }

  async assignAchievement(userId: string, achievementId: string) {
    const userAchievement = await this.prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      update: {},
      create: { userId, achievementId },
    });

    const achievement = await this.prisma.achievement.findUnique({ where: { id: achievementId } });
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
}
