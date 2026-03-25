import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FIGHTER_ROLES, ROLE_LABELS } from '@/types';
import CatOleg from '@/components/CatOleg';
import type { ShopItem } from '@/types';

type TabId = 'backgrounds' | 'badges' | 'cat' | 'achievements';

const TABS: { id: TabId; label: string; icon: string; type: string }[] = [
    { id: 'backgrounds', label: 'Фоны', icon: '🎨', type: 'BACKGROUND' },
    { id: 'badges', label: 'Значки', icon: '⭐', type: 'BADGE' },
    { id: 'cat', label: 'Кот Олег', icon: '🐱', type: 'CAT_ITEM' },
    { id: 'achievements', label: 'Ачивки', icon: '🏆', type: 'ACHIEVEMENT' },
];

export default function ShopPage() {
    const { user, refetch } = useAuth();
    const [tab, setTab] = useState<TabId>('backgrounds');
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user) return;
        const owned = new Set(user.purchases?.map((p) => p.itemId) || []);
        setOwnedIds(owned);
    }, [user]);

    useEffect(() => {
        const currentTab = TABS.find((t) => t.id === tab)!;
        setLoading(true);
        fetch(`/api/shop?type=${currentTab.type}`)
            .then((r) => r.json())
            .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [tab]);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleBuy = async (item: ShopItem) => {
        if (!user || buying) return;
        setBuying(item.id);
        try {
            const res = await fetch('/api/shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.id }),
            });
            const data = await res.json();
            if (res.ok) {
                setOwnedIds((prev) => new Set([...prev, item.id]));
                await refetch();
                showToast(`Куплено: ${item.name}! -${item.price} 🪙`, 'success');
            } else {
                showToast(`${data.error || 'Ошибка покупки'}`, 'error');
            }
        } finally {
            setBuying(null);
        }
    };

    const isFighter = user ? FIGHTER_ROLES.includes(user.role) : false;

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">🛍️ Магазин</h1>
                    <div className="flex items-center gap-1 bg-warning/10 text-warning px-3 py-1 rounded-full">
                        <span className="text-lg">🪙</span>
                        <span className="font-bold">{user?.coins ?? 0}</span>
                    </div>
                </div>

                <div className="flex gap-1 mt-3 overflow-x-auto pb-1 no-scrollbar">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            className={`btn btn-sm gap-1 flex-none transition-all ${tab === t.id ? 'btn-primary' : 'btn-ghost'
                                }`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
            </header>

            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                    <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} shadow-2xl text-sm whitespace-nowrap`}>
                        {toast.msg}
                    </div>
                </div>
            )}

            <main className="px-4 py-4 flex-1">
                {!user && (
                    <div className="alert alert-warning mb-4 shadow-sm text-xs">
                        Необходимо войти в аккаунт для покупок
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="card bg-base-100 animate-pulse h-48 rounded-2xl" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-base-content/60">Предметов в этой категории пока нет</p>
                    </div>
                ) : (
                    <div className={tab === 'backgrounds'
                        ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                        : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}>

                        {tab === 'cat' && (
                            <div className="col-span-full bg-slate-900 rounded-[2.5rem] p-8 mb-4 border border-white/5 relative overflow-hidden flex flex-col items-center">
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                                <div className="relative z-10 scale-110">
                                    <CatOleg
                                        equippedItemIds={user?.catConfig?.equippedItems || []}
                                        ownedItems={user?.purchases || []}
                                        size="lg"
                                    />
                                </div>
                                <div className="mt-6 px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Примерочная Олега</p>
                                </div>
                            </div>
                        )}

                        {items.map((item) => {
                            const owned = ownedIds.has(item.id);
                            const canAfford = (user?.coins ?? 0) >= item.price;
                            const restricted = item.requiresFighter && !isFighter;

                            if (tab === 'backgrounds') {
                                return (
                                    <div key={item.id} className="card bg-white shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden border border-slate-50 group hover:scale-[1.02] transition-all">
                                        <figure className="h-44 overflow-hidden bg-slate-100 relative">
                                            {item.imageUrl && (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                        </figure>
                                        <div className="card-body p-5 flex-row items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-black text-slate-800 uppercase tracking-tighter text-base">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{item.description}</p>
                                            </div>
                                            <div className="text-right flex-none ml-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <span className="text-xs">🪙</span>
                                                    <p className="font-black text-slate-800 tracking-tight">{item.price}</p>
                                                </div>
                                                <button
                                                    className={`btn btn-xs rounded-full mt-2 px-4 uppercase font-black text-[9px] tracking-widest ${owned ? 'btn-success btn-disabled opacity-50' : canAfford && !restricted ? 'btn-primary shadow-lg shadow-primary/20' : 'btn-disabled opacity-30'}`}
                                                    onClick={() => !owned && !restricted && handleBuy(item)}
                                                    disabled={owned || !canAfford || restricted || buying === item.id || !user}
                                                >
                                                    {buying === item.id ? <span className="loading loading-spinner loading-xs" /> : owned ? 'В коллекции' : restricted ? 'Блокировано' : 'Забрать'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={item.id}
                                    className={`card bg-white shadow-lg shadow-slate-200/50 rounded-[2rem] border transition-all hover:scale-[1.02] ${owned ? 'border-primary/20 bg-primary/5' : 'border-slate-50'}`}
                                >
                                    <div className="card-body p-4 items-center text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                            {item.icon?.startsWith('/') || item.icon?.startsWith('http') ? (
                                                <img src={item.icon} className="w-full h-full object-contain" alt="" />
                                            ) : (
                                                item.icon
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 uppercase tracking-tighter text-sm line-clamp-1">{item.name}</p>
                                            {item.description && (
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 line-clamp-2 leading-tight">{item.description}</p>
                                            )}
                                        </div>

                                        {restricted && !isFighter && (
                                            <span className="badge badge-warning badge-xs text-[8px] font-black uppercase mt-1">Отрядный</span>
                                        )}

                                        <div className="w-full pt-3">
                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                <span className="text-xs leading-none">🪙</span>
                                                <p className="font-black text-slate-800 leading-none">{item.price}</p>
                                            </div>
                                            <button
                                                className={`btn btn-sm w-full rounded-2xl uppercase font-black text-[10px] tracking-widest ${owned ? 'btn-success btn-outline' : canAfford && !restricted ? 'btn-primary shadow-md shadow-primary/20' : 'btn-disabled opacity-30'}`}
                                                onClick={() => !owned && !restricted && handleBuy(item)}
                                                disabled={owned || !canAfford || restricted || buying === item.id || !user}
                                            >
                                                {buying === item.id ? <span className="loading loading-spinner loading-xs" /> : owned ? 'Куплено' : 'Купить'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
