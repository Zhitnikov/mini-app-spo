import { Controller, Get, Post, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { BadgesService, NotificationsService } from './misc.services';
import { AuthGuard } from './auth.guard';
import { User } from './user.decorator';

@Controller('api/badges')
@UseGuards(AuthGuard)
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  async getBadges(@User() user: any) {
    return this.badgesService.getBadges(user.userId);
  }

  @Post()
  async equipBadge(@Body() body: { itemId: string, position: number }, @User() user: any) {
    return this.badgesService.equipBadge(user.userId, body.itemId, body.position);
  }

  @Delete()
  async unequipBadge(@Body('itemId') itemId: string, @User() user: any) {
    await this.badgesService.unequipBadge(user.userId, itemId);
    return { ok: true };
  }
}

@Controller('api/notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@User() user: any) {
    return this.notificationsService.getNotifications(user.userId);
  }

  @Patch()
  async markAsRead(@User() user: any) {
    await this.notificationsService.markAllAsRead(user.userId);
    return { ok: true };
  }
}
