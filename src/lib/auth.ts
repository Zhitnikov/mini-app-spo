import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback_secret_change_me'
);

export interface SessionPayload {
    userId: string;
    vkId: number;
    role: string;
    iat?: number;
    exp?: number;
}

export async function signToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
    return await new SignJWT(payload as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}
