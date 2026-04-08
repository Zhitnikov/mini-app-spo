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
import { EventStatus } from '@prisma/client';
import { EventsService } from './events.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../common/decorators/user.decorator';
import type { SessionJwtPayload } from '../common/types/session-jwt';

interface CreateEventBody {
  title: string;
  date: string;
  location: string;
  latitude?: string | number;
  longitude?: string | number;
  imageUrl?: string | null;
  description?: string;
  shortDescription?: string;
  subtitle?: string;
  dateLabel?: string;
  pollQuestion?: string;
  moderationComment?: string;
}

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getAll(@Query('status') status: string) {
    return this.eventsService.getAll(status || 'APPROVED');
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: CreateEventBody, @User() user: SessionJwtPayload) {
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
      latitude: latitude != null ? parseFloat(String(latitude)) : null,
      longitude: longitude != null ? parseFloat(String(longitude)) : null,
      imageUrl: imageUrl ?? null,
      description: description ?? '',
      shortDescription: shortDescription ?? '',
      subtitle: subtitle ?? '',
      dateLabel: dateLabel ?? '',
      pollQuestion: pollQuestion ?? '',
      organizerId: user.userId,
      status: EventStatus.PENDING,
    });
  }

  @Get('my/drafts')
  @UseGuards(AuthGuard)
  async getMyDrafts(
    @User() user: SessionJwtPayload,
    @Query('status') status?: string,
  ) {
    return this.eventsService.getMyDrafts(user.userId, status);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.eventsService.getById(id);
  }

  @Post(':id/attend')
  @UseGuards(AuthGuard)
  async attend(@Param('id') id: string, @User() user: SessionJwtPayload) {
    return this.eventsService.attend(user.userId, id);
  }

  @Get(':id/ticket')
  @UseGuards(AuthGuard)
  async getMyTicket(@Param('id') id: string, @User() user: SessionJwtPayload) {
    return this.eventsService.getMyTicket(id, user.userId);
  }

  @Patch(':id/attend/contact')
  @UseGuards(AuthGuard)
  async setAttendanceEmail(
    @Param('id') id: string,
    @Body() body: { contactEmail: string; emailConsent: boolean },
    @User() user: SessionJwtPayload,
  ) {
    return this.eventsService.upsertAttendanceEmail(
      user.userId,
      id,
      body.contactEmail,
      !!body.emailConsent,
    );
  }

  @Patch(':id/attend')
  @UseGuards(AuthGuard)
  async confirmAttendance(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @User() user: SessionJwtPayload,
  ) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
    return this.eventsService.confirmAttendance(id, userId, user.userId);
  }

  @Delete(':id/attend')
  @UseGuards(AuthGuard)
  async cancelAttendance(
    @Param('id') id: string,
    @User() user: SessionJwtPayload,
  ) {
    await this.eventsService.cancelAttendance(user.userId, id);
    return { ok: true };
  }

  @Post(':id/moderate')
  @UseGuards(AuthGuard)
  async moderate(
    @Param('id') id: string,
    @Body('action') action: 'approve' | 'reject' | 'revision',
    @Body('comment') comment: string,
    @User() user: SessionJwtPayload,
  ) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
    return this.eventsService.moderateEvent(id, action, comment);
  }

  @Patch(':id/resubmit')
  @UseGuards(AuthGuard)
  async resubmitEvent(
    @Param('id') id: string,
    @Body() body: CreateEventBody,
    @User() user: SessionJwtPayload,
  ) {
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
    return this.eventsService.resubmitEvent(user.userId, id, {
      title,
      date: new Date(date),
      location,
      latitude: latitude != null ? parseFloat(String(latitude)) : null,
      longitude: longitude != null ? parseFloat(String(longitude)) : null,
      imageUrl: imageUrl ?? null,
      description: description ?? '',
      shortDescription: shortDescription ?? '',
      subtitle: subtitle ?? '',
      dateLabel: dateLabel ?? '',
      pollQuestion: pollQuestion ?? '',
    });
  }

  @Patch(':id/admin-edit')
  @UseGuards(AuthGuard)
  async adminEditEvent(
    @Param('id') id: string,
    @Body() body: CreateEventBody,
    @User() user: SessionJwtPayload,
  ) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
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
    return this.eventsService.adminEditEvent(id, {
      title,
      date: date ? new Date(date) : undefined,
      location,
      latitude: latitude != null ? parseFloat(String(latitude)) : undefined,
      longitude: longitude != null ? parseFloat(String(longitude)) : undefined,
      imageUrl: imageUrl ?? undefined,
      description,
      shortDescription,
      subtitle,
      dateLabel,
      pollQuestion,
    });
  }

  @Post(':id/checkers')
  @UseGuards(AuthGuard)
  async assignChecker(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @User() user: SessionJwtPayload,
  ) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
    return this.eventsService.assignChecker(id, userId);
  }

  @Get(':id/checkers')
  @UseGuards(AuthGuard)
  async getCheckers(@Param('id') id: string, @User() user: SessionJwtPayload) {
    if (!this.isComsostav(user.role)) throw new ForbiddenException('Forbidden');
    return this.eventsService.getCheckers(id);
  }

  @Post('scan')
  @UseGuards(AuthGuard)
  async scanTicket(
    @Body('qrPayload') qrPayload: string,
    @User() user: SessionJwtPayload,
  ) {
    return this.eventsService.scanAttendance(qrPayload, user.userId);
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
