import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { EventStatus } from '@prisma/client';
import { SignJWT, jwtVerify } from 'jose';
import nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private reminderTimer: NodeJS.Timeout | null = null;
  private readonly qrSecret = new TextEncoder().encode(
    process.env.QR_JWT_SECRET || process.env.JWT_SECRET || 'change_qr_secret',
  );

  constructor(
    private prisma: PrismaService,
    private achievementsService: AchievementsService,
  ) {}

  onModuleInit() {
    this.reminderTimer = setInterval(() => {
      void this.sendUpcomingEventReminders();
    }, 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
    }
  }

  async create(data: Prisma.EventUncheckedCreateInput) {
    return this.prisma.event.create({
      data,
      include: { organizer: true },
    });
  }

  async attend(userId: string, eventId: string) {
    await this.ensureEventApproved(eventId);
    return this.prisma.eventAttendee.upsert({
      where: { userId_eventId: { userId, eventId } },
      update: {},
      create: { userId, eventId },
    });
  }

  async upsertAttendanceEmail(
    userId: string,
    eventId: string,
    contactEmail: string,
    emailConsent: boolean,
  ) {
    const attendance = await this.prisma.eventAttendee.findUnique({
      where: { userId_eventId: { userId, eventId } },
      include: { event: true, user: true },
    });
    if (!attendance) throw new Error('Attendance not found');
    if (!contactEmail || !contactEmail.includes('@')) {
      throw new Error('Invalid email');
    }

    const updated = await this.prisma.eventAttendee.update({
      where: { userId_eventId: { userId, eventId } },
      data: { contactEmail, emailConsent },
    });

    if (emailConsent) {
      const qrPayload = await this.createQrPayload(
        eventId,
        attendance.userId,
        attendance.id,
      );
      await this.sendTicketEmail({
        to: contactEmail,
        event: attendance.event,
        fullName: attendance.user.fullName,
        qrPayload,
        isReminder: false,
      });
    }

    return updated;
  }

  async getAll(status: string = 'APPROVED') {
    const st = this.parseEventStatus(status);
    return this.prisma.event.findMany({
      where: { status: st },
      include: { organizer: true, _count: { select: { attendances: true } } },
      orderBy: { date: 'asc' },
    });
  }

  async getById(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: true,
        attendances: { include: { user: true } },
        checkers: { include: { user: true } },
        _count: { select: { attendances: true } },
      },
    });
  }

  async getMyTicket(eventId: string, userId: string) {
    const attendance = await this.prisma.eventAttendee.findUnique({
      where: { userId_eventId: { userId, eventId } },
      include: { event: true },
    });
    if (!attendance) throw new Error('Attendance not found');
    if (attendance.event.status !== EventStatus.APPROVED) {
      throw new Error('Event is not published');
    }
    const qrPayload = await this.createQrPayload(eventId, userId, attendance.id);
    return {
      attendance,
      qrPayload,
    };
  }

  async getMyDrafts(userId: string, status?: string) {
    const statusFilter = status
      ? this.parseEventStatus(status, EventStatus.PENDING)
      : undefined;
    return this.prisma.event.findMany({
      where: {
        organizerId: userId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async resubmitEvent(
    userId: string,
    eventId: string,
    data: Prisma.EventUncheckedUpdateInput,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');
    if (event.organizerId !== userId) throw new Error('Forbidden');

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...data,
        status: EventStatus.PENDING,
        moderationComment: '',
      },
      include: { organizer: true },
    });
  }

  async adminEditEvent(eventId: string, data: Prisma.EventUncheckedUpdateInput) {
    return this.prisma.event.update({
      where: { id: eventId },
      data,
      include: { organizer: true },
    });
  }

  async moderateEvent(
    eventId: string,
    action: 'approve' | 'reject' | 'revision',
    comment?: string,
  ) {
    const status =
      action === 'approve'
        ? EventStatus.APPROVED
        : action === 'revision'
          ? EventStatus.NEEDS_REVISION
          : EventStatus.REJECTED;
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: { status, moderationComment: comment || '' },
      include: { organizer: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: event.organizerId,
        title:
          action === 'approve'
            ? 'Мероприятие одобрено!'
            : action === 'revision'
              ? 'Нужна доработка мероприятия'
              : 'Мероприятие отклонено',
        message:
          action === 'approve'
            ? `Ваше мероприятие "${event.title}" одобрено комсоставом и опубликовано!`
            : action === 'revision'
              ? `Мероприятие "${event.title}" отправлено на доработку. Комментарий: ${comment || 'Без комментария'}`
              : `Ваше мероприятие "${event.title}" было отклонено комсоставом.`,
      },
    });

    return event;
  }

  async cancelAttendance(userId: string, eventId: string) {
    return this.prisma.eventAttendee.delete({
      where: { userId_eventId: { userId, eventId } },
    });
  }

  async assignChecker(eventId: string, userId: string) {
    return this.prisma.eventChecker.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: {},
      create: { eventId, userId },
      include: { user: true },
    });
  }

  async getCheckers(eventId: string) {
    return this.prisma.eventChecker.findMany({
      where: { eventId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async scanAttendance(qrPayload: string, checkerId: string) {
    const payload = await this.verifyQrPayload(qrPayload);
    const checkerAllowed = await this.isCheckerForEvent(checkerId, payload.eventId);
    if (!checkerAllowed) throw new Error('Forbidden');

    const attendance = await this.prisma.eventAttendee.findUnique({
      where: {
        userId_eventId: { userId: payload.userId, eventId: payload.eventId },
      },
      include: { event: true },
    });
    if (!attendance || attendance.id !== payload.attendanceId) {
      throw new Error('Ticket is invalid');
    }

    if (attendance.confirmedAt) {
      return { ok: true, alreadyVisited: true, attendance };
    }

    await this.prisma.eventAttendee.update({
      where: { userId_eventId: { userId: payload.userId, eventId: payload.eventId } },
      data: { confirmedAt: new Date() },
    });

    await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        title: 'Посещение отмечено',
        message: `Ваш проход на мероприятие "${attendance.event.title}" успешно зафиксирован сканером.`,
      },
    });

    return { ok: true, alreadyVisited: false };
  }

  async confirmAttendance(eventId: string, userId: string, adminId: string) {
    const attendance = await this.prisma.eventAttendee.findUnique({
      where: { userId_eventId: { userId, eventId } },
      include: { event: true },
    });

    if (!attendance) throw new Error('Attendance not found');
    if (attendance.coinsAwarded) return { ok: true, alreadyAwarded: true };

    return this.prisma.$transaction(async (tx) => {
      await tx.eventAttendee.update({
        where: { userId_eventId: { userId, eventId } },
        data: { confirmedAt: new Date(), coinsAwarded: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: attendance.event.coinsReward } },
      });

      await tx.coinTransaction.create({
        data: {
          receiverId: userId,
          senderId: adminId,
          amount: attendance.event.coinsReward,
          reason: `Участие в мероприятии: ${attendance.event.title}`,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: 'Участие подтверждено!',
          message: `Ваше участие в "${attendance.event.title}" подтверждено. Вы получили ${attendance.event.coinsReward} монет!`,
        },
      });

      await this.achievementsService.evaluateAchievementsForUser(userId, tx);

      return { ok: true, coinsAwarded: attendance.event.coinsReward };
    });
  }

  private parseEventStatus(
    status: string,
    fallback: EventStatus = EventStatus.APPROVED,
  ): EventStatus {
    const values = Object.values(EventStatus) as string[];
    return values.includes(status) ? (status as EventStatus) : fallback;
  }

  private async ensureEventApproved(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');
    if (event.status !== EventStatus.APPROVED) {
      throw new Error('Event is not published');
    }
  }

  private async isCheckerForEvent(userId: string, eventId: string) {
    const [asChecker, asComsostav] = await Promise.all([
      this.prisma.eventChecker.findUnique({
        where: { eventId_userId: { eventId, userId } },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    ]);
    const leaders = [
      'COMSOSTAV',
      'COMMANDER',
      'COMMANDANT',
      'EXTERNAL_COMMISSAR',
      'INTERNAL_COMMISSAR',
      'METHODIST',
      'PRESS_CENTER_HEAD',
    ];
    return !!asChecker || (!!asComsostav?.role && leaders.includes(asComsostav.role));
  }

  private async createQrPayload(
    eventId: string,
    userId: string,
    attendanceId: string,
  ): Promise<string> {
    return new SignJWT({ eventId, userId, attendanceId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(this.qrSecret);
  }

  private async verifyQrPayload(qrPayload: string): Promise<{
    eventId: string;
    userId: string;
    attendanceId: string;
  }> {
    const { payload } = await jwtVerify(qrPayload, this.qrSecret);
    const eventId = String(payload.eventId || '');
    const userId = String(payload.userId || '');
    const attendanceId = String(payload.attendanceId || '');
    if (!eventId || !userId || !attendanceId) throw new Error('Invalid payload');
    return { eventId, userId, attendanceId };
  }

  private async sendTicketEmail(params: {
    to: string;
    fullName: string;
    event: {
      id: string;
      title: string;
      date: Date;
      dateLabel: string;
      location: string;
      description: string;
    };
    qrPayload: string;
    isReminder: boolean;
  }) {
    const { to, event, qrPayload, isReminder, fullName } = params;
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || user;
    if (!host || !user || !pass || !from) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject: isReminder
        ? `Напоминание: ${event.title} уже скоро`
        : `Ваш QR-билет на "${event.title}"`,
      html: `
        <h2>${isReminder ? 'Напоминание о мероприятии' : 'Регистрация подтверждена'}</h2>
        <p>Здравствуйте, ${fullName}.</p>
        <p><b>Мероприятие:</b> ${event.title}</p>
        <p><b>Когда:</b> ${event.dateLabel || new Date(event.date).toLocaleString('ru-RU')}</p>
        <p><b>Где:</b> ${event.location}</p>
        <p><b>Описание:</b> ${event.description || 'Без описания'}</p>
        <p>Покажите QR-код на входе:</p>
        <img src="${qrUrl}" alt="QR билет" />
      `,
    });
  }

  private async sendUpcomingEventReminders() {
    const from = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const to = new Date(Date.now() + 25 * 60 * 60 * 1000);
    const attendances = await this.prisma.eventAttendee.findMany({
      where: {
        emailConsent: true,
        contactEmail: { not: null },
        reminderSentAt: null,
        event: {
          status: EventStatus.APPROVED,
          date: { gte: from, lte: to },
        },
      },
      include: { event: true, user: true },
      take: 200,
    });

    for (const row of attendances) {
      try {
        const qrPayload = await this.createQrPayload(
          row.eventId,
          row.userId,
          row.id,
        );
        await this.sendTicketEmail({
          to: row.contactEmail!,
          event: row.event,
          fullName: row.user.fullName,
          qrPayload,
          isReminder: true,
        });
        await this.prisma.eventAttendee.update({
          where: { userId_eventId: { userId: row.userId, eventId: row.eventId } },
          data: { reminderSentAt: new Date() },
        });
      } catch {}
    }
  }
}
