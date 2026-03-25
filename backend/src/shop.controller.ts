import { Controller, Get, Post, Put, Query, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ShopService } from './shop.service';
import { AuthGuard } from './auth.guard';
import { User } from './user.decorator';

@Controller('api')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('shop')
  async getItems(@Query('type') type?: string) {
    return this.shopService.getAllItems(type);
  }

  @Post('shop')
  @UseGuards(AuthGuard)
  async buyItem(@Body('itemId') itemId: string, @User() user: any) {
    return this.shopService.buyItem(user.userId, itemId);
  }

  @Get('cat')
  @UseGuards(AuthGuard)
  async getCat(@User() user: any) {
    return this.shopService.getCatConfig(user.userId);
  }

  @Put('cat')
  @UseGuards(AuthGuard)
  async updateCat(@Body('equippedItems') equippedItems: any, @User() user: any) {
    return this.shopService.updateCatConfig(user.userId, equippedItems);
  }

  @Post('shop-items')
  @UseGuards(AuthGuard)
  async createItem(@Body() body: any, @User() user: any) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
    return this.shopService.createShopItem(body);
  }

  private isComsostav(role: string): boolean {
    const leaders = [
      'COMSOSTAV',
      'COMMANDER',
      'COMMANDANT',
      'EXTERNAL_COMMISSAR',
      'INTERNAL_COMMISSAR',
      'METHODIST',
      'PRESS_CENTER_HEAD',
    ];
    return !!role && leaders.includes(role);
  }
}
