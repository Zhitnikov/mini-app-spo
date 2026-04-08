import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ShopService,
  type CreateShopItemInput,
  type UpdateShopItemInput,
} from './shop.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../common/decorators/user.decorator';
import type { SessionJwtPayload } from '../common/types/session-jwt';

@Controller('api')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('shop')
  async getItems(@Query('type') type?: string) {
    return this.shopService.getAllItems(type);
  }

  @Post('shop')
  @UseGuards(AuthGuard)
  async buyItem(
    @Body('itemId') itemId: string,
    @User() user: SessionJwtPayload,
  ) {
    return this.shopService.buyItem(user.userId, itemId);
  }

  @Get('cat')
  @UseGuards(AuthGuard)
  async getCat(@User() user: SessionJwtPayload) {
    return this.shopService.getCatConfig(user.userId);
  }

  @Put('cat')
  @UseGuards(AuthGuard)
  async updateCat(
    @Body()
    body: {
      equippedItems?: string[];
      equippedCatSkinId?: string;
      skinLoadouts?: Record<string, string[]>;
    },
    @User() user: SessionJwtPayload,
  ) {
    return this.shopService.updateCatConfig(user.userId, {
      equippedItems: body.equippedItems ?? [],
      equippedCatSkinId: body.equippedCatSkinId,
      skinLoadouts: body.skinLoadouts,
    });
  }

  @Post('shop-items')
  @UseGuards(AuthGuard)
  async createItem(
    @Body() body: CreateShopItemInput,
    @User() user: SessionJwtPayload,
  ) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
    return this.shopService.createShopItem(body);
  }

  @Put('shop-items/:id')
  @UseGuards(AuthGuard)
  async updateItem(
    @Param('id') id: string,
    @Body() body: UpdateShopItemInput,
    @User() user: SessionJwtPayload,
  ) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
    return this.shopService.updateShopItem(id, body);
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
