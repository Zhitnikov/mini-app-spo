import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../common/decorators/user.decorator';
import type { SessionJwtPayload } from '../common/types/session-jwt';
import { isManagementLeaderRole } from '../common/leader-roles';

interface CreateAchievementBody {
  name: string;
  description?: string;
  icon: string;
  condition?: string;
}

@ApiTags('achievements')
@Controller('api/achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @ApiOperation({ summary: 'Все достижения' })
  async getAll() {
    return this.achievementsService.getAllAchievements();
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Создать достижение (комсостав)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'icon'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        icon: { type: 'string' },
        condition: { type: 'string' },
      },
    },
  })
  async create(
    @Body() body: CreateAchievementBody,
    @User() currentUser: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(currentUser.role))
      throw new ForbiddenException('Forbidden');
    return this.achievementsService.createAchievement(body);
  }

  @Post('assign')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Выдать достижение пользователю (комсостав)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'achievementId'],
      properties: {
        userId: { type: 'string' },
        achievementId: { type: 'string' },
      },
    },
  })
  async assign(
    @Body() body: { userId: string; achievementId: string },
    @User() currentUser: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(currentUser.role))
      throw new ForbiddenException('Forbidden');
    return this.achievementsService.assignAchievement(
      body.userId,
      body.achievementId,
    );
  }
}
