import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OrbitalBadges from '@/components/OrbitalBadges';
import CatOleg from '@/components/CatOleg';
import { ROLE_LABELS } from '@/types';
import type { UserProfile } from '@/types';

export default function UserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const catOwnedItems = profile.purchases?.filter((p) => p.item.type === 'CAT_ITEM') || [];
    const catEquipped = profile.catConfig?.equippedItems || [];
    const medals = profile.achievements?.slice(0, 5) || [];

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
                        <div className="relative w-32 h-32">
                            {profile.equippedBadges && profile.equippedBadges.length > 0 && (
                                <OrbitalBadges badges={profile.equippedBadges} size={128} />
                            )}
                            <div className="avatar absolute inset-0 flex items-center justify-center">
                                <div className="w-28 h-28 rounded-full ring-8 ring-white shadow-2xl overflow-hidden bg-white">
                                    <img src={profile.avatarUrl || `https://placehold.co/200x200/334155/white?text=${profile.fullName?.[0] || 'U'}`} alt={profile.fullName} className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-8 px-6 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{profile.fullName}</h2>
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
                                <div className="text-lg font-bold text-slate-800 leading-none">{medals.length}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">ачивок</div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="px-4 pb-6 space-y-4">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-lg shadow-slate-200/50 border border-slate-50 flex items-center gap-6">
                    <div className="bg-slate-50 p-2 rounded-3xl">
                        <CatOleg equippedItemIds={catEquipped} ownedItems={catOwnedItems} size="sm" interactive={false} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Верный спутник</p>
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tighter">Кот Олег</h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
