import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import bridge from '@vkontakte/vk-bridge';
import type { UserProfile } from '@/types';

interface AuthContextValue {
    user: UserProfile | null;
    loading: boolean;
    isComsostav: boolean;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    isComsostav: false,
    refetch: async () => { },
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
    } as any : null);

    const [loading, setLoading] = useState(process.env.NODE_ENV !== 'development');

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
                setUser(data.user || data);
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
                setUser(data);
                setLoading(false);
                return true;
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
                } catch (e) { }

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
                        setUser(data.user || data);
                    }
                } catch (vkError) {
                }
            } catch (error) {
                console.error('[AUTH] Critical init error:', error);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [initDevAuth, fetchSession]);

    const COMSOSTAV_ROLES = ['COMSOSTAV', 'COMMANDER', 'COMMANDANT', 'EXTERNAL_COMMISSAR', 'INTERNAL_COMMISSAR', 'METHODIST', 'PRESS_CENTER_HEAD'];

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isComsostav: user ? COMSOSTAV_ROLES.includes(user.role) : false,
                refetch: async () => {
                    setLoading(true);
                    await fetchSession();
                },
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
