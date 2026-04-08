import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SessionJwtPayload } from '../types/session-jwt';

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionJwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }
    return user;
  },
);
