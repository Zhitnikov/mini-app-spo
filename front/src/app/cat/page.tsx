import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CatOleg from '@/components/CatOleg';
import { DEFAULT_CAT_SKIN_ID } from '@/lib/catSkin';
import type { UserShopItem, CatConfig } from '@/types';

function normalizeLoadouts(raw: unknown): Record<string, string[]> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
            out[k] = v;
        }
    }
    return out;
}

export default function CatPage() {
    const { user, loading: authLoading, refetch } = useAuth();
    const [catItems, setCatItems] = useState<UserShopItem[]>([]);
    const [equippedIds, setEquippedIds] = useState<string[]>([]);
    const [skinLoadouts, setSkinLoadouts] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const applyConfigFromServer = useCallback((config: CatConfig | null | undefined) => {
        const loadouts = normalizeLoadouts(config?.skinLoadouts);
        const fallbackWear = config?.equippedItems ?? [];
        const legacySkin = config?.equippedCatSkinId ?? DEFAULT_CAT_SKIN_ID;
        const wearForDefault =
            loadouts[DEFAULT_CAT_SKIN_ID] ??
            (legacySkin !== DEFAULT_CAT_SKIN_ID ? loadouts[legacySkin] : undefined) ??
            fallbackWear;
        setSkinLoadouts({ ...loadouts, [DEFAULT_CAT_SKIN_ID]: [...wearForDefault] });
        setEquippedIds([...wearForDefault]);
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const catRes = await fetch('/api/cat').then((r) => r.json());

                if (catRes.error) throw new Error(catRes.error);

                setCatItems(catRes.ownedCatItems || []);
                applyConfigFromServer(catRes.config);
            } catch (err) {
                console.error('Failed to load cat data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, authLoading, applyConfigFromServer]);

    const toggleCatItem = (itemId: string) => {
        setEquippedIds((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
        );
    };

    const saveCat = async () => {
        setSaving(true);
        try {
            const mergedLoadouts = {
                ...skinLoadouts,
                [DEFAULT_CAT_SKIN_ID]: [...equippedIds],
            };
            const res = await fetch('/api/cat', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    equippedItems: equippedIds,
                    equippedCatSkinId: DEFAULT_CAT_SKIN_ID,
                    skinLoadouts: mergedLoadouts,
                }),
            });
            if (res.ok) {
                setSkinLoadouts(mergedLoadouts);
                await refetch();
            }
        } finally {
            setSaving(false);
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

            </header>

            <main className="p-4 flex-1">
                <div className="space-y-6">
                        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 p-10 border border-slate-50 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                            <CatOleg
                                equippedItemIds={equippedIds}
                                ownedItems={catItems}
                                size="lg"
                                interactive={true}
                            />
                            <div className="mt-8 px-6 py-2 bg-slate-50 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
                                Анимированный кот · одежда из{' '}
                                <Link to="/shop" className="text-primary hover:underline">магазина</Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-lg shadow-slate-200/50 p-6 border border-slate-50">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">👕 Одежда</h3>

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
                            className="w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all bg-primary text-white shadow-primary/20 hover:scale-[1.02]"
                            onClick={saveCat}
                            disabled={saving}
                        >
                            {saving ? <span className="loading loading-spinner loading-xs" /> : '💾 Сохранить гардероб'}
                        </button>
                </div>
            </main>
        </div>
    );
}
