import type { SessionJwtPayload } from '../common/types/session-jwt';

declare global {
  namespace Express {
    interface Request {
      user?: SessionJwtPayload;
    }
  }
}

export {};
