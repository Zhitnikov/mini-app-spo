import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserAchievement, UserShopItem, UserBadge } from '@/types';

export default function ProfileAppearancePage() {
    const { user, refetch } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
    const [selectedAchievementIds, setSelectedAchievementIds] = useState<string[]>([]);
    const [equippedBadges, setEquippedBadges] = useState<UserBadge[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetch(`/api/users/${user.id}`)
            .then((r) => r.json())
            .then((data) => {
                setProfile(data);
                setSelectedBackgroundId(data.backgroundId || null);
                setSelectedAchievementIds(Array.isArray(data.orbitAchievementIds) ? data.orbitAchievementIds : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        fetch('/api/badges').then((r) => r.json()).then((data) => {
            setEquippedBadges(Array.isArray(data) ? data : []);
        }).catch(() => null);
    }, [user]);

    const ownedBadges = useMemo(
        () => (profile?.purchases || []).filter((p: UserShopItem) => p.item.type === 'BADGE'),
        [profile],
    );
    const earnedAchievements = useMemo(
        () => (profile?.achievements || []) as UserAchievement[],
        [profile],
    );
    const ownedBackgrounds = useMemo(
        () => (profile?.purchases || []).filter((p: UserShopItem) => p.item.type === 'BACKGROUND'),
        [profile],
    );

    const toggleAchievement = (achievementId: string) => {
        setSelectedAchievementIds((prev) =>
            prev.includes(achievementId) ? prev.filter((id) => id !== achievementId) : [...prev, achievementId],
        );
    };

    const toggleBadge = async (badge: UserShopItem) => {
        const isEquipped = equippedBadges.some((b) => b.itemId === badge.itemId);
        if (isEquipped) {
            await fetch('/api/badges', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: badge.itemId }),
            });
            setEquippedBadges((prev) => prev.filter((b) => b.itemId !== badge.itemId));
            return;
        }
        const res = await fetch('/api/badges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: badge.itemId, position: equippedBadges.length }),
        });
        if (res.ok) {
            const data = await res.json();
            setEquippedBadges((prev) => [...prev, data]);
        }
    };

    const save = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    backgroundId: selectedBackgroundId,
                    orbitAchievementIds: selectedAchievementIds,
                }),
            });
            if (!res.ok) {
                alert('Не удалось сохранить внешний вид');
                return;
            }
            await refetch();
            navigate('/profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">Загрузка...</div>;

    return (
        <div className="flex flex-col p-4 gap-4">
            <header className="flex items-center gap-2">
                <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>←</button>
                <h1 className="text-base font-bold">Редактировать внешний вид</h1>
            </header>

            <section className="bg-white rounded-2xl border border-slate-200 p-4">
                <h2 className="text-sm font-bold mb-3">Фон профиля</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        className={`border rounded-xl p-2 text-xs ${selectedBackgroundId === null ? 'border-primary' : 'border-slate-200'}`}
                        onClick={() => setSelectedBackgroundId(null)}
                    >
                        Без фона
                    </button>
                    {ownedBackgrounds.map((bg: UserShopItem) => (
                        <button
                            key={bg.id}
                            className={`border rounded-xl p-1 ${selectedBackgroundId === bg.itemId ? 'border-primary' : 'border-slate-200'}`}
                            onClick={() => setSelectedBackgroundId(bg.itemId)}
                        >
                            {bg.item.imageUrl && <img src={bg.item.imageUrl} className="w-full h-16 object-cover rounded-lg" alt="" />}
                            <p className="text-[10px] mt-1">{bg.item.name}</p>
                        </button>
                    ))}
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-4">
                <h2 className="text-sm font-bold mb-3">Значки в орбите</h2>
                <div className="grid grid-cols-4 gap-2">
                    {ownedBadges.map((badge: UserShopItem) => {
                        const active = equippedBadges.some((b) => b.itemId === badge.itemId);
                        return (
                            <button key={badge.id} className={`border rounded-xl p-2 ${active ? 'border-primary bg-primary/5' : 'border-slate-200'}`} onClick={() => toggleBadge(badge)}>
                                <div className="text-xl">{badge.item.icon}</div>
                                <div className="text-[9px]">{badge.item.name}</div>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-4">
                <h2 className="text-sm font-bold mb-3">Достижения в орбите</h2>
                <div className="grid grid-cols-3 gap-2">
                    {earnedAchievements.map((ua) => {
                        const active = selectedAchievementIds.includes(ua.achievementId);
                        return (
                            <button key={ua.id} className={`border rounded-xl p-2 text-left ${active ? 'border-primary bg-primary/5' : 'border-slate-200'}`} onClick={() => toggleAchievement(ua.achievementId)}>
                                <div className="text-lg">{ua.achievement.icon}</div>
                                <div className="text-[10px]">{ua.achievement.name}</div>
                            </button>
                        );
                    })}
                </div>
            </section>

            <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Сохраняем...' : 'Сохранить внешний вид'}
            </button>
        </div>
    );
}
