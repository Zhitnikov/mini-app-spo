import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../common/decorators/user.decorator';
import type { SessionJwtPayload } from '../common/types/session-jwt';
import { isManagementLeaderRole } from '../common/leader-roles';
import { TreasurySyncService } from './treasury-sync.service';
import {
  MaterialsService,
  type CreateMaterialInput,
  type UpdateMaterialInput,
} from './materials.service';
import { UserRole } from '@prisma/client';

@ApiTags('resources')
@Controller('api/resources')
export class ResourcesController {
  constructor(
    private readonly treasurySync: TreasurySyncService,
    private readonly materials: MaterialsService,
  ) {}

  @Get('treasury')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Отрядная касса (кэш из Google Таблицы)' })
  async getTreasury(@User() user: SessionJwtPayload) {
    if (user.role === UserRole.CANDIDATE) {
      throw new ForbiddenException(
        'Отрядная касса доступна бойцам и комсоставу',
      );
    }

    let cache = await this.treasurySync.getCached();
    if (!cache) {
      await this.treasurySync.syncFromGoogleSheet();
      cache = await this.treasurySync.getCached();
    }
    if (!cache) {
      throw new NotFoundException('Данные кассы пока не загружены');
    }

    return {
      headers: cache.headers as string[],
      rows: cache.rows as string[][],
      syncedAt: cache.syncedAt,
    };
  }

  @Post('treasury/sync')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({
    summary: 'Принудительно обновить кассу из таблицы (комсостав)',
  })
  async syncTreasury(@User() user: SessionJwtPayload) {
    if (!isManagementLeaderRole(user.role)) {
      throw new ForbiddenException('Forbidden');
    }
    const result = await this.treasurySync.syncFromGoogleSheet();
    const cache = await this.treasurySync.getCached();
    return {
      ...result,
      syncedAt: cache?.syncedAt ?? null,
      rowCount: cache ? (cache.rows as string[][]).length : 0,
    };
  }

  @Get('materials')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Документы, доступные текущему пользователю' })
  async listMaterials(@User() user: SessionJwtPayload) {
    return this.materials.listForUser(user.userId, user.role as UserRole);
  }

  @Get('materials/admin')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Все документы (комсостав)' })
  async listMaterialsAdmin(@User() user: SessionJwtPayload) {
    this.materials.assertAdmin(user.role);
    return this.materials.listAllAdmin();
  }

  @Post('materials')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Загрузить метаданные документа (комсостав)' })
  async createMaterial(
    @Body() body: CreateMaterialInput,
    @User() user: SessionJwtPayload,
  ) {
    this.materials.assertAdmin(user.role);
    if (!body.title?.trim() || !body.fileUrl || !body.fileName) {
      throw new ForbiddenException('title, fileUrl и fileName обязательны');
    }
    return this.materials.create(user.userId, body);
  }

  @Patch('materials/:id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Изменить документ и доступ (комсостав)' })
  async updateMaterial(
    @Param('id') id: string,
    @Body() body: UpdateMaterialInput,
    @User() user: SessionJwtPayload,
  ) {
    this.materials.assertAdmin(user.role);
    return this.materials.update(id, body);
  }

  @Delete('materials/:id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Удалить документ (комсостав)' })
  async deleteMaterial(
    @Param('id') id: string,
    @User() user: SessionJwtPayload,
  ) {
    this.materials.assertAdmin(user.role);
    return this.materials.delete(id);
  }

  @Get('materials/:id/access')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Проверить доступ к файлу перед скачиванием' })
  async materialAccess(
    @Param('id') id: string,
    @User() user: SessionJwtPayload,
  ) {
    const doc = await this.materials.assertCanDownload(
      id,
      user.userId,
      user.role as UserRole,
    );
    return {
      id: doc.id,
      title: doc.title,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
    };
  }
}
