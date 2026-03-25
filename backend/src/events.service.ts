import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.event.create({
      data,
      include: { organizer: true },
    });
  }

  async attend(userId: string, eventId: string) {
    return this.prisma.eventAttendee.upsert({
      where: { userId_eventId: { userId, eventId } },
      update: {},
      create: { userId, eventId },
    });
  }

  async getAll(status: string = 'APPROVED') {
    return this.prisma.event.findMany({
      where: { status: status as any },
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
        _count: { select: { attendances: true } },
      },
    });
  }

  async moderateEvent(eventId: string, action: 'approve' | 'reject', adminId: string) {
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: status as any },
      include: { organizer: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: event.organizerId,
        title: action === 'approve' ? '🎉 Мероприятие одобрено!' : 'Мероприятие отклонено',
        message: action === 'approve'
          ? `Ваше мероприятие "${event.title}" одобрено комсоставом и опубликовано!`
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

      return { ok: true, coinsAwarded: attendance.event.coinsReward };
    });
  }
}
