import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OrbitalBadges, { ORBIT_AVATAR_Z } from '@/components/OrbitalBadges';
import CatOleg from '@/components/CatOleg';
import { resolveCatSkinLottieUrl } from '@/lib/catSkin';
import { ROLE_LABELS } from '@/types';
import type { UserProfile } from '@/types';

export default function UserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllAttended, setShowAllAttended] = useState(false);
    const [showAllOrganized, setShowAllOrganized] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/users/${id}`)
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
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
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

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Профиль не найден</h2>
                <p className="text-slate-500 mb-6">{error || 'Пользователь не существует'}</p>
                <button onClick={() => navigate(-1)} className="btn btn-primary rounded-2xl px-8">Вернуться назад</button>
            </div>
        );
    }

    const catSkinPurchases = profile.purchases?.filter((p) => p.item.type === 'CAT_SKIN') || [];
    const equippedCatSkinId = profile.catConfig?.equippedCatSkinId ?? null;
    const allMedals = profile.achievements || [];
    const selectedAchievementIds = profile.orbitAchievementIds || [];
    const medals = allMedals.filter((ua) => selectedAchievementIds.includes(ua.achievementId)).slice(0, 6);
    const orbitAchievementItems = medals.map((ua) => ({
        id: `ach-${ua.id}`,
        name: ua.achievement.name,
        icon: ua.achievement.icon,
    }));
    const attendedEvents = profile.attendances || [];
    const organizedEvents = profile.organizedEvents || [];
    const ownedBadgePurchases = (profile.purchases || []).filter((p) => p.item.type === 'BADGE');

    return (
        <div className="flex flex-col min-h-full bg-slate-50 pb-20 md:pb-6">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-square">←</button>
                <h1 className="text-sm font-bold tracking-tight text-slate-800">Профиль участника</h1>
            </header>

            <div className="p-4">
                <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
                    <div className="h-40 w-full relative bg-slate-100 overflow-hidden">
                        {profile.background?.imageUrl ? (
                            <img src={profile.background.imageUrl} alt="Фон" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100" />
                        )}
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 top-20">
                        <div className="relative isolate w-32 h-32">
                            <OrbitalBadges badges={profile.equippedBadges || []} items={orbitAchievementItems} size={128} />
                            <div
                                className="avatar absolute inset-0 flex items-center justify-center"
                                style={{ zIndex: ORBIT_AVATAR_Z }}
                            >
                                <div className="w-28 h-28 rounded-full ring-8 ring-white shadow-2xl overflow-hidden bg-white">
                                    <img src={profile.avatarUrl || `https://placehold.co/200x200/334155/white?text=${profile.fullName?.[0] || 'U'}`} alt={profile.fullName} className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-8 px-4 sm:px-6 text-center">
                        <h2 className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight break-words px-1">{profile.fullName}</h2>
                        <div className="mt-2 inline-flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {ROLE_LABELS[profile.role] || profile.role}
                        </div>

                        <div className="mt-8 grid grid-cols-3 gap-4 border-y border-slate-50 py-6">
                            <div className="p-2">
                                <div className="text-lg font-bold text-slate-800 leading-none">{profile.coins}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">монет</div>
                            </div>
                            <div className="p-2">
                                <div className="text-lg font-bold text-slate-800 leading-none">{profile._count?.attendances ?? 0}</div>
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
                <div className="bg-white p-4 sm:p-6 rounded-[2.5rem] shadow-lg shadow-slate-200/50 border border-slate-50 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 overflow-hidden">
                    <div className="bg-slate-50 p-2 sm:p-3 rounded-3xl shrink-0 w-full max-w-[132px] sm:max-w-none flex justify-center mx-auto sm:mx-0">
                        <CatOleg
                            equippedItemIds={[]}
                            ownedItems={[]}
                            catSkinLottieSrc={resolveCatSkinLottieUrl(equippedCatSkinId, catSkinPurchases)}
                            size="md"
                            interactive={false}
                            enableIdleFloat={false}
                        />
                    </div>
                    <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Верный спутник</p>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 uppercase tracking-tighter break-words">Кот Олег</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 min-h-44">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Значки</h3>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                            {ownedBadgePurchases.map((p) => (
                                    <div key={p.id} className="flex-none flex flex-col items-center text-center w-16 relative">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg mb-1">
                                            {p.item.icon?.startsWith('/') || p.item.icon?.startsWith('http') ? (
                                                <img src={p.item.icon} className="w-7 h-7 object-contain" alt="" />
                                            ) : (
                                                p.item.icon
                                            )}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-500 leading-tight">{p.item.name}</span>
                                    </div>
                            ))}
                            {ownedBadgePurchases.length === 0 && (
                                <p className="text-xs text-slate-500">Нет купленных значков.</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 min-h-44">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Достижения</h3>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                            {allMedals.slice(0, 8).map((ua) => (
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
