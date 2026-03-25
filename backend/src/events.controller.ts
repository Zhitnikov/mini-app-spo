import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthGuard } from './auth.guard';
import { User } from './user.decorator';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getAll(@Query('status') status: string) {
    return this.eventsService.getAll(status || 'APPROVED');
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @User() user: any) {
    const {
      title,
      date,
      location,
      latitude,
      longitude,
      imageUrl,
      description,
      shortDescription,
      subtitle,
      dateLabel,
      pollQuestion,
    } = body;
    if (!title || !date || !location) {
      throw new Error('Missing required fields');
    }

    return this.eventsService.create({
      title,
      date: new Date(date),
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      imageUrl: imageUrl || null,
      description: description || '',
      shortDescription: shortDescription || '',
      subtitle: subtitle || '',
      dateLabel: dateLabel || '',
      pollQuestion: pollQuestion || '',
      organizerId: user.userId,
      status: 'PENDING',
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.eventsService.getById(id);
  }

  @Post(':id/attend')
  @UseGuards(AuthGuard)
  async attend(@Param('id') id: string, @User() user: any) {
    return this.eventsService.attend(user.userId, id);
  }

  @Patch(':id/attend')
  @UseGuards(AuthGuard)
  async confirmAttendance(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @User() user: any,
  ) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
    return this.eventsService.confirmAttendance(id, userId, user.userId);
  }

  @Delete(':id/attend')
  @UseGuards(AuthGuard)
  async cancelAttendance(@Param('id') id: string, @User() user: any) {
    await this.eventsService.cancelAttendance(user.userId, id);
    return { ok: true };
  }

  @Post(':id/moderate')
  @UseGuards(AuthGuard)
  async moderate(
    @Param('id') id: string,
    @Body('action') action: 'approve' | 'reject',
    @User() user: any,
  ) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
    return this.eventsService.moderateEvent(id, action, user.userId);
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
