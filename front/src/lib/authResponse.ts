import type { UserProfile } from '@/types';
import { setSessionToken } from '@/lib/sessionToken';

type AuthPayload = UserProfile | { user?: UserProfile; token?: string };

export function parseAuthResponse(data: AuthPayload): UserProfile | null {
    if (!data || typeof data !== 'object') return null;

    if ('user' in data && data.user && typeof data.user === 'object' && 'id' in data.user) {
        if (typeof data.token === 'string') setSessionToken(data.token);
        return data.user as UserProfile;
    }

    if ('id' in data && 'vkId' in data) {
        if ('token' in data) {
            setSessionToken((data as { token: string }).token);
        }
        return data as UserProfile;
    }

    return null;
}
