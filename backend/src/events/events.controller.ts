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
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { EventsService } from './events.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../common/decorators/user.decorator';
import type { SessionJwtPayload } from '../common/types/session-jwt';
import { isManagementLeaderRole } from '../common/leader-roles';

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

@ApiTags('events')
@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Список событий' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Фильтр статуса (по умолчанию APPROVED)',
    example: 'APPROVED',
  })
  async getAll(@Query('status') status: string) {
    return this.eventsService.getAll(status || 'APPROVED');
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Создать событие (черновик на модерацию)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'date', 'location'],
      properties: {
        title: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        location: { type: 'string' },
        latitude: { oneOf: [{ type: 'number' }, { type: 'string' }] },
        longitude: { oneOf: [{ type: 'number' }, { type: 'string' }] },
        imageUrl: { type: 'string', nullable: true },
        description: { type: 'string' },
        shortDescription: { type: 'string' },
        subtitle: { type: 'string' },
        dateLabel: { type: 'string' },
        pollQuestion: { type: 'string' },
        moderationComment: { type: 'string' },
      },
    },
  })
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
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Мои черновики / на доработке' })
  @ApiQuery({ name: 'status', required: false })
  async getMyDrafts(
    @User() user: SessionJwtPayload,
    @Query('status') status?: string,
  ) {
    return this.eventsService.getMyDrafts(user.userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Событие по id' })
  @ApiParam({ name: 'id' })
  async getById(@Param('id') id: string) {
    return this.eventsService.getById(id);
  }

  @Post(':id/attend')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Записаться на событие' })
  @ApiParam({ name: 'id' })
  async attend(@Param('id') id: string, @User() user: SessionJwtPayload) {
    return this.eventsService.attend(user.userId, id);
  }

  @Get(':id/ticket')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Мой билет / QR' })
  @ApiParam({ name: 'id' })
  async getMyTicket(@Param('id') id: string, @User() user: SessionJwtPayload) {
    return this.eventsService.getMyTicket(id, user.userId);
  }

  @Patch(':id/attend/contact')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Email для билета и согласие' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['contactEmail', 'emailConsent'],
      properties: {
        contactEmail: { type: 'string' },
        emailConsent: { type: 'boolean' },
      },
    },
  })
  async setAttendanceEmail(
    @Param('id') id: string,
    @Body() body: { contactEmail: string; emailConsent: boolean },
    @User() user: SessionJwtPayload,
  ) {
    return this.eventsService.upsertAttendanceEmail(
      user.userId,
      id,
      body.contactEmail,
      body.emailConsent,
    );
  }

  @Patch(':id/attend')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Подтвердить посещение участника (комсостав)' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId'],
      properties: { userId: { type: 'string' } },
    },
  })
  async confirmAttendance(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @User() user: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(user.role))
      throw new ForbiddenException('Forbidden');
    return this.eventsService.confirmAttendance(id, userId, user.userId);
  }

  @Delete(':id/attend')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Отменить свою запись' })
  @ApiParam({ name: 'id' })
  async cancelAttendance(
    @Param('id') id: string,
    @User() user: SessionJwtPayload,
  ) {
    await this.eventsService.cancelAttendance(user.userId, id);
    return { ok: true };
  }

  @Post(':id/moderate')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Модерация события (комсостав)' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['action'],
      properties: {
        action: { type: 'string', enum: ['approve', 'reject', 'revision'] },
        comment: { type: 'string' },
      },
    },
  })
  async moderate(
    @Param('id') id: string,
    @Body('action') action: 'approve' | 'reject' | 'revision',
    @Body('comment') comment: string,
    @User() user: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(user.role))
      throw new ForbiddenException('Forbidden');
    return this.eventsService.moderateEvent(id, action, comment);
  }

  @Patch(':id/resubmit')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Повторная подача после доработки' })
  @ApiParam({ name: 'id' })
  @ApiBody({ description: 'Как при создании события' })
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
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Редактирование события админом' })
  @ApiParam({ name: 'id' })
  @ApiBody({ description: 'Поля события (частично опциональны)' })
  async adminEditEvent(
    @Param('id') id: string,
    @Body() body: CreateEventBody,
    @User() user: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(user.role))
      throw new ForbiddenException('Forbidden');
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

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Удалить событие (комсостав)' })
  @ApiParam({ name: 'id' })
  async deleteEvent(@Param('id') id: string, @User() user: SessionJwtPayload) {
    if (!isManagementLeaderRole(user.role))
      throw new ForbiddenException('Forbidden');
    await this.eventsService.deleteEvent(id);
    return { ok: true };
  }

  @Post(':id/checkers')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Назначить чекера на событие' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId'],
      properties: { userId: { type: 'string' } },
    },
  })
  async assignChecker(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @User() user: SessionJwtPayload,
  ) {
    if (!isManagementLeaderRole(user.role))
      throw new ForbiddenException('Forbidden');
    return this.eventsService.assignChecker(id, userId);
  }

  @Get(':id/checkers')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Список чекеров события' })
  @ApiParam({ name: 'id' })
  async getCheckers(@Param('id') id: string, @User() user: SessionJwtPayload) {
    if (!isManagementLeaderRole(user.role))
      throw new ForbiddenException('Forbidden');
    return this.eventsService.getCheckers(id);
  }

  @Post('scan')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('spo_session')
  @ApiOperation({ summary: 'Скан QR билета (чекер)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['qrPayload'],
      properties: { qrPayload: { type: 'string' } },
    },
  })
  async scanTicket(
    @Body('qrPayload') qrPayload: string,
    @User() user: SessionJwtPayload,
  ) {
    return this.eventsService.scanAttendance(qrPayload, user.userId);
  }
}
