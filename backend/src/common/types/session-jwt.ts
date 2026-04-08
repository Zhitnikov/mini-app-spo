import type { JWTPayload } from 'jose';

/** JWT claims issued by AuthService (SignJWT) and read by AuthGuard / @User() */
export interface SessionJwtPayload extends JWTPayload {
  userId: string;
  vkId: number;
  role: string;
}
