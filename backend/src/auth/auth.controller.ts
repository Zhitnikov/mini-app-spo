import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { readSessionToken } from './session-token';
import type { Request, Response } from 'express';
import { UserRole } from '@prisma/client';

@ApiTags('auth')
@Controller('api/auth/vk')
export class AuthController {
  private buildSessionCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite: 'none' | 'lax' = isProd ? 'none' : 'lax';
    return {
      httpOnly: true as const,
      secure: isProd,
      sameSite,
      maxAge: 60 * 60 * 24 * 7 * 1000,
      path: '/',
    };
  }

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Вход по VK',
    description:
      'Создаёт/обновляет пользователя и выставляет httpOnly cookie `spo_session`.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['vkId', 'firstName', 'lastName'],
      properties: {
        vkId: { type: 'number', example: 123456 },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatarUrl: { type: 'string', nullable: true },
      },
    },
  })
  async login(
    @Body()
    body: {
      vkId: number;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.vkId) throw new UnauthorizedException('vkId is required');

    const result = await this.authService.login(
      body.vkId,
      body.firstName,
      body.lastName,
      body.avatarUrl,
    );

    res.cookie('spo_session', result.token, this.buildSessionCookieOptions());

    return { user: result.user, token: result.token };
  }

  @Get()
  @ApiOperation({
    summary: 'Текущая сессия',
    description: 'Читает cookie `spo_session` и возвращает пользователя.',
  })
  async checkSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = readSessionToken(req);
    if (!token) throw new UnauthorizedException('No session');

    const session = await this.authService.verifyToken(token);
    if (!session) throw new UnauthorizedException('Invalid session');

    let user = await this.usersService.findById(session.userId);
    if (!user) throw new NotFoundException('User not found');

    const envRefresh = await this.authService.refreshSessionIfEnvAdmin(user);
    if (envRefresh.newToken) {
      const reloaded = await this.usersService.findById(session.userId);
      if (reloaded) user = reloaded;
    }

    if (
      user.vkId === 1 &&
      process.env.NODE_ENV === 'development' &&
      user.role !== UserRole.COMMANDER
    ) {
      await this.usersService.update(user.id, {
        role: UserRole.COMMANDER,
        coins: { set: Math.max(user.coins, 1000) },
      });
      user = (await this.usersService.findById(user.id)) ?? user;
    }

    const sessionToken = await this.authService.signToken({
      userId: user.id,
      vkId: user.vkId,
      role: user.role,
    });
    res.cookie('spo_session', sessionToken, this.buildSessionCookieOptions());

    return { user, token: sessionToken };
  }

  @Delete()
  @ApiOperation({ summary: 'Выход', description: 'Сбрасывает cookie сессии.' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('spo_session', this.buildSessionCookieOptions());
    return { ok: true };
  }
}
