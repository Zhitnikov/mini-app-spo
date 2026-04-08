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
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import type { Request, Response } from 'express';
import { UserRole } from '@prisma/client';

@Controller('api/auth/vk')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
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

    res.cookie('spo_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 * 1000,
      path: '/',
    });

    return result;
  }

  @Get()
  async checkSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as
      | Record<string, string | undefined>
      | undefined;
    const token = cookies?.['spo_session'];
    if (typeof token !== 'string')
      throw new UnauthorizedException('No session');

    const session = await this.authService.verifyToken(token);
    if (!session) throw new UnauthorizedException('Invalid session');

    const user = await this.usersService.findById(session.userId);
    if (!user) throw new NotFoundException('User not found');

    const { user: afterEnvAdmin, newToken } =
      await this.authService.refreshSessionIfEnvAdmin(user);
    if (newToken) {
      res.cookie('spo_session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 * 1000,
        path: '/',
      });
    }

    if (
      afterEnvAdmin.vkId === 1 &&
      process.env.NODE_ENV === 'development' &&
      afterEnvAdmin.role !== UserRole.COMMANDER
    ) {
      await this.usersService.update(afterEnvAdmin.id, {
        role: UserRole.COMMANDER,
        coins: { set: Math.max(afterEnvAdmin.coins, 1000) },
      });
      const refreshed = await this.usersService.findById(afterEnvAdmin.id);
      return refreshed ?? afterEnvAdmin;
    }

    return afterEnvAdmin;
  }

  @Delete()
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('spo_session');
    return { ok: true };
  }
}
