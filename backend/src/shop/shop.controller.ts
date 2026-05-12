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
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import {
  ShopService,
  type CreateShopItemInput,
  type UpdateShopItemInput,
} from './shop.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../common/decorators/user.decorator';
import type { SessionJwtPayload } from '../common/types/session-jwt';
import { isManagementLeaderRole } from '../common/leader-roles';

@ApiTags('shop', 'cat')
@Controller('api')
export class ShopController {
  private readonly lottieDir = join(
    process.cwd(),
    '..',
    'front',
    'public',
    'lottie',
  );

  constructor(private readonly shopService: ShopService) {
    mkdirSync(this.lottieDir, { recursive: true });
  }

  @Get('shop')
  @ApiOperation({ summary: 'Каталог товаров' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Фильтр по типу товара (например CAT_SKIN)',
  })
  async getItems(@Query('type') type?: string) {
    return this.shopService.getAllItems(type);
  }

  @Post('shop')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Купить товар' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['itemId'],
      properties: { itemId: { type: 'string' } },
    },
  })
  async buyItem(
    @Body('itemId') itemId: string,
    @User() user: SessionJwtPayload,
  ) {
    return this.shopService.buyItem(user.userId, itemId);
  }

  @Get('cat')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Конфиг кота и купленные скины' })
  async getCat(@User() user: SessionJwtPayload) {
    return this.shopService.getCatConfig(user.userId);
  }

  @Put('cat')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Сохранить экипировку и скин кота' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        equippedItems: { type: 'array', items: { type: 'string' } },
        equippedCatSkinId: { type: 'string' },
        skinLoadouts: {
          type: 'object',
          additionalProperties: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  })
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
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Создать товар (комсостав)' })
  @ApiBody({
    description: 'Поля товара (см. CreateShopItemInput в shop.service)',
  })
  async createItem(
    @Body() body: CreateShopItemInput,
    @User() user: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(user.role))
      throw new ForbiddenException('Forbidden');
    return this.shopService.createShopItem(body);
  }

  @Put('shop-items/:id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Обновить товар (комсостав)' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    description: 'Поля товара (см. UpdateShopItemInput в shop.service)',
  })
  async updateItem(
    @Param('id') id: string,
    @Body() body: UpdateShopItemInput,
    @User() user: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(user.role))
      throw new ForbiddenException('Forbidden');
    return this.shopService.updateShopItem(id, body);
  }

  @Post('shop-items/upload-lottie')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Загрузить .lottie для скина (комсостав)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Только .lottie',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        cb(null, ext === '.lottie');
      },
      storage: diskStorage({
        destination: (req, file, cb) =>
          cb(null, join(process.cwd(), '..', 'front', 'public', 'lottie')),
        filename: (req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext === '.lottie' ? ext : '.lottie'}`);
        },
      }),
    }),
  )
  async uploadLottie(
    @UploadedFile() file: Express.Multer.File,
    @User() user: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(user.role))
      throw new ForbiddenException('Forbidden');
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/lottie/${file.filename}` };
  }
}
