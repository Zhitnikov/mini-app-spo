import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CatOleg from '@/components/CatOleg';
import OrbitalBadges from '@/components/OrbitalBadges';
import type { UserShopItem, UserBadge } from '@/types';

export default function CatPage() {
    const { user, loading: authLoading, refetch } = useAuth();
    const navigate = useNavigate();
    const [catItems, setCatItems] = useState<UserShopItem[]>([]);
    const [equippedIds, setEquippedIds] = useState<string[]>([]);
    const [equippedBadges, setEquippedBadges] = useState<UserBadge[]>([]);
    const [ownedBadges, setOwnedBadges] = useState<UserShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState<'cat' | 'badges'>('cat');

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const [catRes, badgesRes] = await Promise.all([
                    fetch('/api/cat').then(r => r.json()),
                    fetch('/api/badges').then(r => r.json())
                ]);

                if (catRes.error) throw new Error(catRes.error);

                setCatItems(catRes.ownedCatItems || []);
                setEquippedIds(catRes.config?.equippedItems || []);
                setEquippedBadges(Array.isArray(badgesRes) ? badgesRes : []);

                const ownedB = user.purchases?.filter((p) => p.item.type === 'BADGE') || [];
                setOwnedBadges(ownedB);
            } catch (err) {
                console.error('Failed to load cat data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, authLoading]);

    const toggleCatItem = (itemId: string) => {
        setEquippedIds((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    const saveCat = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/cat', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ equippedItems: equippedIds }),
            });
            if (res.ok) await refetch();
        } finally {
            setSaving(false);
        }
    };

    const toggleBadge = async (badge: UserShopItem) => {
        const isEquipped = equippedBadges.some((b) => b.itemId === badge.itemId);
        try {
            if (isEquipped) {
                await fetch('/api/badges', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemId: badge.itemId }),
                });
                setEquippedBadges((prev) => prev.filter((b) => b.itemId !== badge.itemId));
            } else {
                const res = await fetch('/api/badges', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemId: badge.itemId, position: equippedBadges.length }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setEquippedBadges((prev) => [...prev, data]);
                }
            }
        } catch (e) {
            console.error('Toggle badge failed:', e);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 bg-slate-50">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Загружаем гардероб...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                <div className="text-6xl mb-4">🐱</div>
                <h2 className="text-xl font-black text-slate-800 uppercase italic">Кот Олег ждет тебя</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-xs">Чтобы переодеть Олега, необходимо авторизоваться через VK.</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary mt-6 rounded-2xl px-10 uppercase font-black text-xs tracking-widest">Войти</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-slate-50 overflow-y-auto no-scrollbar pb-24 md:pb-8">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-sm font-black tracking-widest uppercase text-slate-800">КОТ ОЛЕГ</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Твой верный спутник</p>
                    </div>
                </div>

                <div className="flex mt-6 bg-slate-100 p-1 rounded-2xl">
                    <button
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'cat' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => setTab('cat')}
                    >
                        🐱 Гардероб
                    </button>
                    <button
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'badges' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => setTab('badges')}
                    >
                        ⭐ Значки
                    </button>
                </div>
            </header>

            <main className="p-4 flex-1">
                {tab === 'cat' ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 p-10 border border-slate-50 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                            <CatOleg
                                equippedItemIds={equippedIds}
                                ownedItems={catItems}
                                size="lg"
                                interactive={true}
                            />
                            <div className="mt-8 px-6 py-2 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                                Студенческий Кот
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-lg shadow-slate-200/50 p-6 border border-slate-50">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">📦 Мои вещи</h3>

                            {catItems.length === 0 ? (
                                <div className="text-center py-12 px-6 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-tight leading-relaxed">
                                        В гардеробе пока пусто.<br />
                                        Загляни в <Link to="/shop" className="text-primary hover:underline">Магазин</Link> за обновками!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {catItems.map((ui) => {
                                        const equipped = equippedIds.includes(ui.itemId);
                                        return (
                                            <button
                                                key={ui.id}
                                                onClick={() => toggleCatItem(ui.itemId)}
                                                className={`aspect-square flex flex-col items-center justify-center p-2 rounded-[1.5rem] border-2 transition-all relative ${equipped ? 'border-primary bg-primary/5' : 'border-slate-50 hover:border-slate-100 bg-slate-50/50'}`}
                                            >
                                                <span className="text-4xl flex items-center justify-center w-full h-12">
                                                    {ui.item.icon?.startsWith('/') || ui.item.icon?.startsWith('http') ? (
                                                        <img src={ui.item.icon} className="w-full h-full object-contain" alt="" />
                                                    ) : (
                                                        ui.item.icon
                                                    )}
                                                </span>
                                                <span className="text-[9px] mt-2 font-black text-slate-800 uppercase tracking-tighter truncate w-full px-1">{ui.item.name}</span>
                                                {equipped && (
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] shadow-lg shadow-primary/30">✓</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all ${equippedIds.length > 0 ? 'bg-primary text-white shadow-primary/20 hover:scale-[1.02]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            onClick={saveCat}
                            disabled={saving}
                        >
                            {saving ? <span className="loading loading-spinner loading-xs" /> : '💾 Сохранить образ'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 p-12 border border-slate-50 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-radial-gradient from-primary/10 to-transparent opacity-50" />
                            <div className="relative w-40 h-40">
                                <OrbitalBadges badges={equippedBadges} size={160} />
                                <div className="avatar absolute inset-0 flex items-center justify-center p-4">
                                    <div className="w-full h-full rounded-full ring-8 ring-white shadow-xl overflow-hidden bg-white">
                                        <img
                                            src={user?.avatarUrl || `https://placehold.co/100x100/6366f1/white?text=${user?.fullName?.[0] || 'U'}`}
                                            alt={user?.fullName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Визуализация наград</p>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-lg shadow-slate-200/50 p-6 border border-slate-50">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">✨ Мои значки</h3>

                            {ownedBadges.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-slate-400 text-xs font-bold uppercase">Купи свой первый значок в магазине!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {ownedBadges.map((ui) => {
                                        const equipped = equippedBadges.some((b) => b.itemId === ui.itemId);
                                        return (
                                            <button
                                                key={ui.id}
                                                onClick={() => toggleBadge(ui)}
                                                className={`aspect-square flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all relative ${equipped ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-50 bg-slate-50/50'}`}
                                            >
                                                <span className="text-3xl flex items-center justify-center w-full h-10">
                                                    {ui.item.icon?.startsWith('/') || ui.item.icon?.startsWith('http') ? (
                                                        <img src={ui.item.icon} className="w-full h-full object-contain" alt="" />
                                                    ) : (
                                                        ui.item.icon
                                                    )}
                                                </span>
                                                <span className="text-[8px] mt-2 font-black text-slate-500 uppercase tracking-tighter truncate w-full px-1">{ui.item.name}</span>
                                                {equipped && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[9px]">✓</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
