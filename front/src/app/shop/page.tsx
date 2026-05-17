import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CatOleg from '@/components/CatOleg';
import { getFallbackCatSkinLottieUrl, resolveCatSkinLottieUrl } from '@/lib/catSkin';
import type { ShopItem } from '@/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

type TabId = 'backgrounds' | 'badges' | 'cats';

const TABS: Array<{ id: TabId; label: string; type: 'BACKGROUND' | 'BADGE' | 'CAT_SKIN' }> = [
    { id: 'backgrounds', label: 'Фоны', type: 'BACKGROUND' },
    { id: 'badges', label: 'Значки', type: 'BADGE' },
    { id: 'cats', label: 'Коты', type: 'CAT_SKIN' },
];

export default function ShopPage() {
    const { user, patchUser } = useAuth();
    const [tab, setTab] = useState<TabId>('backgrounds');
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user?.purchases?.length) return;
        setOwnedIds((prev) => {
            const merged = new Set(prev);
            for (const p of user.purchases ?? []) {
                merged.add(p.itemId);
            }
            return merged;
        });
    }, [user?.id, user?.purchases]);

    useEffect(() => {
        const currentTab = TABS.find((t) => t.id === tab);
        if (!currentTab) return;
        setLoading(true);
        fetch(`/api/shop?type=${currentTab.type}`)
            .then((r) => r.json())
            .then((data) => {
                setItems(Array.isArray(data) ? data : []);
                setLoading(false);
            })
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
                const purchase = data.purchase as { itemId: string; item?: ShopItem } | undefined;
                const nextCoins =
                    typeof data.user?.coins === 'number'
                        ? data.user.coins
                        : (user.coins ?? 0) - item.price;
                const prevPurchases = user.purchases ?? [];
                const alreadyListed = prevPurchases.some((p) => p.itemId === item.id);
                patchUser({
                    coins: nextCoins,
                    purchases: alreadyListed
                        ? prevPurchases
                        : [
                            ...prevPurchases,
                            {
                                id: purchase?.itemId ?? item.id,
                                itemId: item.id,
                                userId: user.id,
                                purchasedAt: new Date().toISOString(),
                                item: purchase?.item ?? item,
                            },
                        ],
                });
                showToast(`Куплено: ${item.name}! -${item.price} 🪙`, 'success');
            } else {
                const msg =
                    typeof data.message === 'string'
                        ? data.message
                        : data.error || 'Ошибка покупки';
                if (res.status === 400 && String(msg).toLowerCase().includes('куплен')) {
                    setOwnedIds((prev) => new Set([...prev, item.id]));
                }
                showToast(msg, 'error');
            }
        } finally {
            setBuying(null);
        }
    };

    const catSkinPurchases = user?.purchases?.filter((p) => p.item.type === 'CAT_SKIN') ?? [];
    const previewSkinId = user?.catConfig?.equippedCatSkinId && user.catConfig.equippedCatSkinId !== 'cat_skin_default'
        ? user.catConfig.equippedCatSkinId
        : catSkinPurchases[0]?.itemId ?? items[0]?.id ?? 'cat_skin_default';
    const sortedItems = [...items].sort((a, b) => Number(ownedIds.has(a.id)) - Number(ownedIds.has(b.id)));
    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Магазин котов</h1>
                    <div className="flex items-center gap-1 bg-warning/10 text-warning px-3 py-1 rounded-full">
                        <span className="text-lg"><FontAwesomeIcon icon={faCoins} /></span>
                        <span className="font-bold">{user?.coins ?? 0}</span>
                    </div>
                </div>
                <div className="flex gap-1 mt-3 overflow-x-auto">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
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
                ) : sortedItems.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-base-content/60">В этой категории пока пусто</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {tab === 'cats' && (
                            <div className="col-span-full bg-slate-900 rounded-[2.5rem] p-8 mb-4 border border-white/5 relative overflow-visible flex flex-col items-center">
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-[2.5rem] overflow-hidden pointer-events-none" />
                                <div className="relative z-10 scale-105 py-2">
                                    <CatOleg
                                        equippedItemIds={[]}
                                        ownedItems={[]}
                                        catSkinLottieSrc={resolveCatSkinLottieUrl(previewSkinId, catSkinPurchases)}
                                        size="lg"
                                    />
                                </div>
                            </div>
                        )}

                        {sortedItems.map((item) => {
                            const owned = ownedIds.has(item.id);
                            const canAfford = (user?.coins ?? 0) >= item.price;
                            return (
                            <div key={item.id} className="card bg-white shadow-lg shadow-slate-200/50 rounded-[2rem] border border-slate-50 transition-all hover:scale-[1.02]">
                                <div className="card-body p-4 items-center text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                        {tab === 'cats' && (item.catSkinLottieUrl || getFallbackCatSkinLottieUrl(item.id)) ? (
                                            <DotLottieReact
                                                src={item.catSkinLottieUrl ? encodeURI(item.catSkinLottieUrl) : (getFallbackCatSkinLottieUrl(item.id) || undefined)}
                                                loop
                                                autoplay
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        ) : item.imageUrl ? (
                                            <img src={item.imageUrl} className="w-full h-full object-cover rounded-xl" alt="" />
                                        ) : item.icon?.startsWith('/') || item.icon?.startsWith('http') ? (
                                            <img src={item.icon} className="w-full h-full object-contain" alt="" />
                                        ) : (
                                            item.icon || 'CAT'
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-slate-800 uppercase tracking-tighter text-sm line-clamp-1">{item.name}</p>
                                        {item.description && (
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 line-clamp-2 leading-tight">{item.description}</p>
                                        )}
                                    </div>
                                    <div className="w-full pt-3">
                                        <div className="flex items-center justify-center gap-1 mb-2">
                                            <span className="text-xs leading-none"><FontAwesomeIcon icon={faCoins} /></span>
                                            <p className="font-black text-slate-800 leading-none">{item.price}</p>
                                        </div>
                                        <button
                                            className={`btn btn-sm w-full rounded-2xl uppercase font-black text-[10px] tracking-widest ${owned ? 'btn-success btn-outline' : canAfford ? 'btn-primary' : 'btn-disabled opacity-30'}`}
                                            onClick={() => !owned && handleBuy(item)}
                                            disabled={owned || !canAfford || buying === item.id || !user}
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
