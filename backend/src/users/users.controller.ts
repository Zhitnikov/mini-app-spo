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
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole, type Prisma } from '@prisma/client';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../common/decorators/user.decorator';
import type { SessionJwtPayload } from '../common/types/session-jwt';
import { isManagementLeaderRole } from '../common/leader-roles';

interface PatchUserBody {
  role?: UserRole;
  backgroundId?: string;
  coins?: number;
  avatarUrl?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  orbitAchievementIds?: string[];
}

interface CreateUserBody {
  vkId: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  coins?: number;
  avatarUrl?: string | null;
  backgroundId?: string | null;
  orbitAchievementIds?: string[];
}

interface AddCoinsBody {
  amount: number;
  reason: string;
}

@ApiTags('users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Список пользователей' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Поиск по имени / vkId',
  })
  async getAll(@Query('q') q?: string) {
    return this.usersService.getAll(q);
  }

  @Post('create')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Создать пользователя (комсостав)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['vkId', 'fullName'],
      properties: {
        vkId: { type: 'number' },
        fullName: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        coins: { type: 'number' },
        avatarUrl: { type: 'string', nullable: true },
        backgroundId: { type: 'string', nullable: true },
        orbitAchievementIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async create(
    @Body() body: CreateUserBody,
    @User() currentUser: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(currentUser.role))
      throw new ForbiddenException('Forbidden');
    const vkRaw = body.vkId as unknown;
    const vkId =
      typeof vkRaw === 'number'
        ? vkRaw
        : typeof vkRaw === 'string'
          ? parseInt(vkRaw, 10)
          : NaN;
    if (!Number.isFinite(vkId) || vkId < 1) {
      throw new BadRequestException('vkId must be a positive number');
    }
    if (!body.fullName) {
      throw new BadRequestException('fullName is required');
    }
    return this.usersService.create({
      vkId: Math.floor(vkId),
      fullName: body.fullName,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      coins: body.coins,
      avatarUrl: body.avatarUrl,
      backgroundId: body.backgroundId,
      orbitAchievementIds: body.orbitAchievementIds,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Пользователь по id' })
  @ApiParam({ name: 'id' })
  async getById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({
    summary: 'Обновить пользователя',
    description: 'Владелец или комсостав (роль и монеты — только комсостав).',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: { type: 'string' },
        backgroundId: { type: 'string', nullable: true },
        coins: { type: 'number' },
        avatarUrl: { type: 'string' },
        fullName: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        orbitAchievementIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() body: PatchUserBody,
    @User() currentUser: SessionJwtPayload,
  ) {
    const isOwner = currentUser.userId === id;
    const isAdmin = isManagementLeaderRole(currentUser.role);

    if (!isOwner && !isAdmin) throw new ForbiddenException('Forbidden');

    const updateData: Prisma.UserUpdateInput = {};

    if (isAdmin && body.role !== undefined) {
      updateData.role = body.role;
    }
    if (body.backgroundId !== undefined) {
      updateData.background = body.backgroundId
        ? { connect: { id: body.backgroundId } }
        : { disconnect: true };
    }
    if (isAdmin && body.coins !== undefined) {
      updateData.coins = { set: body.coins };
    }
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
    }
    if (body.fullName !== undefined) {
      updateData.fullName = body.fullName;
    }
    if (body.firstName !== undefined) {
      updateData.firstName = body.firstName;
    }
    if (body.lastName !== undefined) {
      updateData.lastName = body.lastName;
    }
    if (body.orbitAchievementIds !== undefined) {
      updateData.orbitAchievementIds = body.orbitAchievementIds;
    }

    const user = await this.usersService.update(id, updateData);

    if (isAdmin && body.role !== undefined && body.role !== currentUser.role) {
      await this.usersService.createNotification({
        userId: id,
        title: 'Ваша роль изменена',
        message: `Комсостав изменил вашу роль на: ${String(body.role)}`,
      });
    }

    return user;
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Удалить пользователя (комсостав)' })
  @ApiParam({ name: 'id' })
  async delete(
    @Param('id') id: string,
    @User() currentUser: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(currentUser.role))
      throw new ForbiddenException('Forbidden');
    await this.usersService.delete(id);
    return { ok: true };
  }

  @Post(':id/coins')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Начислить/списать монеты (комсостав)' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount', 'reason'],
      properties: {
        amount: { type: 'number', description: 'Может быть отрицательным' },
        reason: { type: 'string' },
      },
    },
  })
  async addCoins(
    @Param('id') id: string,
    @Body() body: AddCoinsBody,
    @User() currentUser: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(currentUser.role))
      throw new ForbiddenException('Forbidden');

    const { amount, reason } = body;
    if (!amount) throw new Error('Invalid amount');

    return this.usersService.addCoins(id, amount, reason, currentUser.userId);
  }
}
