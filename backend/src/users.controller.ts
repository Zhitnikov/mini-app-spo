import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from './auth.guard';
import { User } from './user.decorator';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAll() {
    return this.usersService.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @User() currentUser: any) {
    const isOwner = currentUser.userId === id;
    const isAdmin = this.isComsostav(currentUser.role);

    if (!isOwner && !isAdmin) throw new ForbiddenException('Forbidden');

    const allowedFields = isAdmin
      ? ['role', 'backgroundId', 'coins', 'avatarUrl', 'fullName']
      : ['backgroundId', 'avatarUrl', 'fullName'];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const user = await this.usersService.update(id, updateData);

    if (isAdmin && body.role && body.role !== currentUser.role) {
      await this.usersService.createNotification({
        userId: id,
        title: 'Ваша роль изменена',
        message: `Комсостав изменил вашу роль на: ${body.role}`,
      });
    }

    return user;
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string, @User() currentUser: any) {
    if (!this.isComsostav(currentUser.role)) throw new ForbiddenException('Forbidden');
    await this.usersService.delete(id);
    return { ok: true };
  }

  @Post(':id/coins')
  @UseGuards(AuthGuard)
  async addCoins(@Param('id') id: string, @Body() body: any, @User() currentUser: any) {
    if (!this.isComsostav(currentUser.role)) throw new ForbiddenException('Forbidden');

    const { amount, reason } = body;
    if (!amount || typeof amount !== 'number') throw new Error('Invalid amount');

    return this.usersService.addCoins(id, amount, reason, currentUser.userId);
  }

  private isComsostav(role: string): boolean {
    const leaders = ['COMSOSTAV', 'COMMANDER', 'COMMANDANT', 'EXTERNAL_COMMISSAR', 'INTERNAL_COMMISSAR', 'METHODIST', 'PRESS_CENTER_HEAD'];
    return !!role && leaders.includes(role);
  }
}
