import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import { prisma } from '@/lib/prisma';
import { EventService, UserService } from '@/services';

const builder = new SchemaBuilder<{
    PrismaTypes: PrismaTypes;
}>({
    plugins: [PrismaPlugin],
    prisma: {
        client: prisma,
    },
});

builder.prismaObject('User', {
    fields: (t) => ({
        id: t.exposeID('id'),
        vkId: t.exposeInt('vkId'),
        fullName: t.exposeString('fullName'),
        role: t.exposeString('role'),
        coins: t.exposeInt('coins'),
        avatarUrl: t.exposeString('avatarUrl', { nullable: true }),
        attendances: t.relation('attendances'),
        achievements: t.relation('achievements'),
    }),
});

builder.prismaObject('Event', {
    fields: (t) => ({
        id: t.exposeID('id'),
        title: t.exposeString('title'),
        description: t.exposeString('description'),
        dateLabel: t.exposeString('dateLabel'),
        location: t.exposeString('location'),
        organizer: t.relation('organizer'),
        attendances: t.relation('attendances'),
    }),
});

builder.prismaObject('EventAttendee', {
    fields: (t) => ({
        id: t.exposeID('id'),
        user: t.relation('user'),
        event: t.relation('event'),
        confirmedAt: t.expose('confirmedAt', { type: 'DateTime', nullable: true }),
    }),
});

builder.prismaObject('UserAchievement', {
    fields: (t) => ({
        id: t.exposeID('id'),
        achievement: t.relation('achievement'),
        earnedAt: t.expose('earnedAt', { type: 'DateTime' }),
    }),
});

builder.prismaObject('Achievement', {
    fields: (t) => ({
        id: t.exposeID('id'),
        name: t.exposeString('name'),
        icon: t.exposeString('icon'),
    }),
});

builder.scalarType('DateTime', {
    serialize: (date) => (date instanceof Date ? date.toISOString() : date),
    parseValue: (value) => new Date(value as string),
});

builder.queryType({
    fields: (t) => ({
        me: t.prismaField({
            type: 'User',
            args: { id: t.arg.string({ required: true }) },
            resolve: async (query, _parent, args) => prisma.user.findUniqueOrThrow({ ...query, where: { id: args.id } }),
        }),
        events: t.prismaField({
            type: ['Event'],
            resolve: async (query) => prisma.event.findMany({ ...query, where: { status: 'APPROVED' } }),
        }),
        event: t.prismaField({
            type: 'Event',
            args: { id: t.arg.string({ required: true }) },
            resolve: async (query, _parent, args) => prisma.event.findUniqueOrThrow({ ...query, where: { id: args.id } }),
        }),
    }),
});

export const schema = builder.toSchema();
