import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BadgesService, NotificationsService } from './misc.services';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../common/decorators/user.decorator';
import type { SessionJwtPayload } from '../common/types/session-jwt';

@ApiTags('badges')
@Controller('api/badges')
@UseGuards(AuthGuard)
@ApiCookieAuth('spo_session')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'Мои значки и слоты' })
  async getBadges(@User() user: SessionJwtPayload) {
    return this.badgesService.getBadges(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Надеть значок в слот' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['itemId', 'position'],
      properties: {
        itemId: { type: 'string' },
        position: { type: 'number' },
      },
    },
  })
  async equipBadge(
    @Body() body: { itemId: string; position: number },
    @User() user: SessionJwtPayload,
  ) {
    return this.badgesService.equipBadge(
      user.userId,
      body.itemId,
      body.position,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Снять значок' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['itemId'],
      properties: { itemId: { type: 'string' } },
    },
  })
  async unequipBadge(
    @Body('itemId') itemId: string,
    @User() user: SessionJwtPayload,
  ) {
    await this.badgesService.unequipBadge(user.userId, itemId);
    return { ok: true };
  }
}

@ApiTags('notifications')
@Controller('api/notifications')
@UseGuards(AuthGuard)
@ApiCookieAuth('spo_session')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Список уведомлений' })
  async getNotifications(@User() user: SessionJwtPayload) {
    return this.notificationsService.getNotifications(user.userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Отметить все как прочитанные' })
  async markAsRead(@User() user: SessionJwtPayload) {
    await this.notificationsService.markAllAsRead(user.userId);
    return { ok: true };
  }
}
