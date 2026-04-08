import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import OrbitalBadges from '@/components/OrbitalBadges';
import CatOleg from '@/components/CatOleg';
import { equippedWearForActiveSkin } from '@/lib/catSkin';
import { ROLE_LABELS } from '@/types';
import type { UserProfile } from '@/types';

export default function ProfilePage() {
    const { user: authUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllAttended, setShowAllAttended] = useState(false);
    const [showAllOrganized, setShowAllOrganized] = useState(false);

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!authUser) {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`/api/users/${authUser.id}`)
            .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed to load profile');
                return data;
            })
            .then((data) => {
                setProfile(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Profile load error:', err);
                setProfile(authUser as unknown as UserProfile);
                setLoading(false);
            });
    }, [authUser, authLoading]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const { url } = await uploadRes.json();

            if (url) {
                const updateRes = await fetch(`/api/users/${profile.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatarUrl: url }),
                });

                if (updateRes.ok) {
                    const updatedUser = await updateRes.json();
                    setProfile(updatedUser);
                }
            }
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Не удалось загрузить фото');
        } finally {
            setUploading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex flex-col h-full bg-slate-50">
                <div className="animate-pulse p-4 space-y-4">
                    <div className="h-48 bg-slate-200 rounded-3xl" />
                    <div className="h-10 bg-slate-200 rounded-xl w-1/2 mx-auto" />
                    <div className="h-32 bg-slate-200 rounded-3xl" />
                </div>
            </div>
        );
    }

    if (error || !authUser) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                <div className="text-6xl mb-4">👤</div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">
                    {!authUser ? 'Доступ ограничен' : 'Загрузка не удалась'}
                </h2>
                <p className="text-sm text-slate-500 mb-6 max-w-xs">
                    {!authUser
                        ? 'Пожалуйста, авторизуйтесь для просмотра своего профиля.'
                        : error}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary px-8"
                >
                    Обновить
                </button>
            </div>
        );
    }

    const safeProfile = profile || (authUser as unknown as UserProfile);
    const catOwnedItems = safeProfile.purchases?.filter((p) => p.item.type === 'CAT_ITEM') || [];
    const catEquipped = equippedWearForActiveSkin(safeProfile.catConfig);
    const allMedals = safeProfile.achievements || [];
    const selectedAchievementIds = safeProfile.orbitAchievementIds || [];
    const medals = allMedals.filter((ua) => selectedAchievementIds.includes(ua.achievementId)).slice(0, 6);
    const achievementOrbitItems = medals.map((ua) => ({
        id: `ach-${ua.id}`,
        name: ua.achievement.name,
        icon: ua.achievement.icon,
    }));
    const badgesPreview = (safeProfile.equippedBadges || []).slice(0, 6);
    const attendedEvents = safeProfile.attendances || [];
    const organizedEvents = safeProfile.organizedEvents || [];

    return (
        <div className="flex flex-col min-h-full bg-slate-50 pb-20 md:pb-6">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <h1 className="text-sm font-bold tracking-tight text-slate-800">ПРОФИЛЬ</h1>
                <div className="text-[10px] font-medium text-slate-400">ID: {safeProfile.vkId}</div>
            </header>

            <div className="p-4">
                <section className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-200 relative">
                    <div className="h-36 w-full relative bg-slate-100 overflow-hidden">
                        {safeProfile.background?.imageUrl ? (
                            <img
                                src={safeProfile.background.imageUrl}
                                alt="Фон"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100" />
                        )}
                        <button
                            className="btn btn-xs btn-primary absolute top-3 right-3 z-10"
                            onClick={() => navigate('/profile/appearance')}
                        >
                            Редактировать внешний вид
                        </button>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 top-16">
                        <div className="relative w-32 h-32 group">
                            <OrbitalBadges badges={safeProfile.equippedBadges || []} items={achievementOrbitItems} size={128} />
                            <label className="avatar absolute inset-0 flex items-center justify-center cursor-pointer">
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-white relative">
                                    <img
                                        src={safeProfile.avatarUrl || `https://placehold.co/200x200/334155/white?text=${safeProfile.fullName?.[0] || 'U'}`}
                                        alt={safeProfile.fullName}
                                        className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-30' : 'group-hover:opacity-80'}`}
                                    />
                                    {uploading ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="loading loading-spinner text-primary" />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                                            <span className="text-white text-xs font-bold">ИЗМЕНИТЬ</span>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-16 pb-8 px-6 text-center">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{safeProfile.fullName}</h2>
                        <div className="mt-2 inline-flex items-center gap-2 bg-slate-50 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {ROLE_LABELS[safeProfile.role] || safeProfile.role}
                        </div>

                        <div className="mt-8 grid grid-cols-3 gap-0 border-y border-slate-50 py-6">
                            <Link to="/shop" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="text-lg font-bold text-slate-800 leading-none">{safeProfile.coins}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">монет</div>
                            </Link>
                            <div className="p-2">
                                <div className="text-lg font-bold text-slate-800 leading-none">{safeProfile._count?.attendances ?? 0}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">выездов</div>
                            </div>
                            <div className="p-2">
                                <div className="text-lg font-bold text-slate-800 leading-none">{allMedals.length}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">ачивок</div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="px-4 pb-6 space-y-4">
                <div
                    className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4 cursor-pointer hover:border-primary/20 transition-colors group"
                    onClick={() => navigate('/cat')}
                >
                    <div className="bg-slate-50 p-2 rounded-2xl group-hover:bg-slate-100 transition-colors">
                        <CatOleg
                            equippedItemIds={catEquipped}
                            ownedItems={catOwnedItems}
                            size="sm"
                            interactive={false}
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-800">Кот Олег</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            {catEquipped.length > 0 ? `Одето предметов: ${catEquipped.length}` : 'Ваш кот ждет обновок!'}
                        </p>
                    </div>
                    <div className="text-slate-300 group-hover:text-primary transition-colors">→</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 min-h-44">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Достижения</h3>
                            <Link to="/achievements" className="text-[10px] font-bold text-primary hover:underline">Все →</Link>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                            {allMedals.slice(0, 6).map((ua) => (
                                <div key={ua.id} className="flex-none flex flex-col items-center text-center w-16">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg mb-1">
                                        {ua.achievement.icon}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 leading-tight">{ua.achievement.name}</span>
                                </div>
                            ))}
                            {allMedals.length === 0 && <p className="text-xs text-slate-500">Нет достижений</p>}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 min-h-44">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Значки</h3>
                            <button className="text-[10px] font-bold text-primary" onClick={() => navigate('/profile/appearance')}>Настроить →</button>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                            {badgesPreview.map((b) => (
                                <div key={b.id} className="flex-none flex flex-col items-center text-center w-16">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg mb-1">
                                        {b.item.icon}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 leading-tight">{b.item.name}</span>
                                </div>
                            ))}
                            {badgesPreview.length === 0 && <p className="text-xs text-slate-500">Нет выбранных значков</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Link to="/shop" className="btn btn-primary h-12 text-[11px] uppercase tracking-wide">
                        🛍️ В Магазин
                    </Link>
                    <Link to="/propose-event" className="btn btn-outline h-12 text-[11px] uppercase tracking-wide border-slate-300 text-slate-600">
                        📝 Предложить
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Посещенные мероприятия</h3>
                        {attendedEvents.length > 3 && (
                            <button className="text-[10px] font-bold text-primary" onClick={() => setShowAllAttended((v) => !v)}>
                                {showAllAttended ? 'Скрыть' : 'Показать все'}
                            </button>
                        )}
                    </div>
                    {(showAllAttended ? attendedEvents : attendedEvents.slice(0, 3)).map((a) => (
                        <button key={a.id} className="w-full text-left py-2 border-b border-slate-100 last:border-0" onClick={() => navigate(`/events/${a.event.id}`)}>
                            <p className="text-sm font-semibold">{a.event.title}</p>
                            <p className="text-xs text-slate-500">{a.event.dateLabel}</p>
                        </button>
                    ))}
                    {attendedEvents.length === 0 && <p className="text-xs text-slate-500">Пока нет посещенных мероприятий.</p>}
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Организованные мероприятия</h3>
                        {organizedEvents.length > 3 && (
                            <button className="text-[10px] font-bold text-primary" onClick={() => setShowAllOrganized((v) => !v)}>
                                {showAllOrganized ? 'Скрыть' : 'Показать все'}
                            </button>
                        )}
                    </div>
                    {(showAllOrganized ? organizedEvents : organizedEvents.slice(0, 3)).map((e) => (
                        <button key={e.id} className="w-full text-left py-2 border-b border-slate-100 last:border-0" onClick={() => navigate(`/events/${e.id}`)}>
                            <p className="text-sm font-semibold">{e.title}</p>
                            <p className="text-xs text-slate-500">{e.dateLabel}</p>
                        </button>
                    ))}
                    {organizedEvents.length === 0 && <p className="text-xs text-slate-500">Пока нет организованных мероприятий.</p>}
                </div>
            </div>
        </div>
    );
}
