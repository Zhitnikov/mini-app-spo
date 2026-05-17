import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import bridge from '@vkontakte/vk-bridge';
import type { UserProfile } from '@/types';
import { isManagementLeaderRole } from '@/lib/leaderRoles';
import { parseAuthResponse } from '@/lib/authResponse';

interface AuthContextValue {
    user: UserProfile | null;
    loading: boolean;
    isComsostav: boolean;
    refetch: () => Promise<void>;
    patchUser: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    isComsostav: false,
    refetch: async () => { },
    patchUser: () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(process.env.NODE_ENV === 'development' ? {
        id: 'dev-admin-id',
        vkId: 1,
        fullName: 'Admin Developer',
        firstName: 'Admin',
        lastName: 'Developer',
        role: 'COMMANDER',
        coins: 1000,
        avatarUrl: 'https://placehold.co/200x200/6366f1/white?text=ADMIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { attendances: 0, organizedEvents: 0 }
    } as unknown as UserProfile : null);

    const [loading, setLoading] = useState(process.env.NODE_ENV !== 'development');

    const patchUser = useCallback((patch: Partial<UserProfile>) => {
        setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    }, []);

    const initDevAuth = useCallback(async () => {
        if (process.env.NODE_ENV !== 'development') return;
        try {
            const authRes = await fetch('/api/auth/vk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vkId: 1,
                    firstName: 'Admin',
                    lastName: 'Developer',
                    avatarUrl: 'https://placehold.co/200x200/6366f1/white?text=ADMIN',
                }),
            });

            if (authRes.ok) {
                const data = await authRes.json();
                const parsed = parseAuthResponse(data);
                if (parsed) setUser(parsed);
            }
        } catch (e) {
            console.error('[DEV] Dev auth failed', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSession = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/vk');
            if (res.ok) {
                const data = await res.json();
                const parsed = parseAuthResponse(data);
                if (parsed) {
                    setUser(parsed);
                    return true;
                }
            }
        } catch (e) {
            console.error('[AUTH] Session fetch failed', e);
        }
        return false;
    }, []);

    useEffect(() => {
        async function init() {
            if (process.env.NODE_ENV === 'development') {
                await initDevAuth();
                return;
            }

            setLoading(true);
            try {
                try {
                    await bridge.send('VKWebAppInit');
                } catch {
                    /* VK bridge optional */
                }

                const hasSession = await fetchSession();
                if (hasSession) return;

                try {
                    const vkUser = await bridge.send('VKWebAppGetUserInfo');
                    const authRes = await fetch('/api/auth/vk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vkId: vkUser.id,
                            firstName: vkUser.first_name,
                            lastName: vkUser.last_name,
                            avatarUrl: vkUser.photo_200,
                        }),
                    });

                    if (authRes.ok) {
                        const data = await authRes.json();
                        const parsed = parseAuthResponse(data);
                        if (parsed) setUser(parsed);
                    }
                } catch {
                    /* user declined VK auth */
                }
            } catch (error) {
                console.error('[AUTH] Critical init error:', error);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [initDevAuth, fetchSession]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') return;

        const refresh = () => {
            if (document.visibilityState === 'visible') {
                void fetchSession();
            }
        };

        document.addEventListener('visibilitychange', refresh);
        window.addEventListener('focus', refresh);
        const interval = window.setInterval(() => {
            void fetchSession();
        }, 60_000);

        return () => {
            document.removeEventListener('visibilitychange', refresh);
            window.removeEventListener('focus', refresh);
            window.clearInterval(interval);
        };
    }, [fetchSession]);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            await fetchSession();
        } finally {
            setLoading(false);
        }
    }, [fetchSession]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isComsostav: user ? isManagementLeaderRole(user.role) : false,
                refetch,
                patchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
