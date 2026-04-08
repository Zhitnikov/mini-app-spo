import type { JWTPayload } from 'jose';

export interface SessionJwtPayload extends JWTPayload {
  userId: string;
  vkId: number;
  role: string;
}
