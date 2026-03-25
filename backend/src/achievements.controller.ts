import { Controller, Get, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AuthGuard } from './auth.guard';
import { User } from './user.decorator';

@Controller('api/achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getAll() {
    return this.achievementsService.getAllAchievements();
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @User() currentUser: any) {
    if (!this.isComsostav(currentUser.role)) throw new ForbiddenException('Forbidden');
    return this.achievementsService.createAchievement(body);
  }

  @Post('assign')
  @UseGuards(AuthGuard)
  async assign(@Body() body: { userId: string, achievementId: string }, @User() currentUser: any) {
    if (!this.isComsostav(currentUser.role)) throw new ForbiddenException('Forbidden');
    return this.achievementsService.assignAchievement(body.userId, body.achievementId);
  }

  private isComsostav(role: string): boolean {
    const leaders = ['COMSOSTAV', 'COMMANDER', 'COMMANDANT', 'EXTERNAL_COMMISSAR', 'INTERNAL_COMMISSAR', 'METHODIST', 'PRESS_CENTER_HEAD'];
    return !!role && leaders.includes(role);
  }
}
