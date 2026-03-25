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
import { UsersService } from './users.service';
import type { Request, Response } from 'express';

@Controller('api/auth/vk')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async login(
    @Body() body: { vkId: number; firstName: string; lastName: string; avatarUrl?: string },
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
  async checkSession(@Req() req: Request) {
    const token = req.cookies['spo_session'];
    if (!token) throw new UnauthorizedException('No session');

    const session = await this.authService.verifyToken(token);
    if (!session) throw new UnauthorizedException('Invalid session');

    let user = await this.usersService.findById(session.userId);
    if (!user) throw new NotFoundException('User not found');

    if (
      user.vkId === 1 &&
      process.env.NODE_ENV === 'development' &&
      user.role !== 'COMMANDER'
    ) {
      user = (await this.usersService.update(user.id, {
        role: 'COMMANDER',
        coins: { set: Math.max(user.coins, 1000) },
      })) as any;
    }

    return user;
  }

  @Delete()
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('spo_session');
    return { ok: true };
  }
}
