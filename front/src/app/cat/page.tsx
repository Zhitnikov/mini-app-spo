import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAuth } from '@/contexts/AuthContext';
import CatOleg from '@/components/CatOleg';
import { DEFAULT_CAT_SKIN_ID, getFallbackCatSkinLottieUrl, resolveCatSkinLottieUrl } from '@/lib/catSkin';
import type { UserShopItem, CatConfig } from '@/types';

export default function CatPage() {
    const { user, loading: authLoading, refetch } = useAuth();
    const [catItems, setCatItems] = useState<UserShopItem[]>([]);
    const [equippedSkinId, setEquippedSkinId] = useState<string>(DEFAULT_CAT_SKIN_ID);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const applyConfigFromServer = useCallback((config: CatConfig | null | undefined) => {
        setEquippedSkinId(config?.equippedCatSkinId ?? DEFAULT_CAT_SKIN_ID);
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

                const ownedSkins = Array.isArray(catRes.ownedCatSkins) ? catRes.ownedCatSkins : [];
                setCatItems(ownedSkins);
                applyConfigFromServer(catRes.config);
            } catch (err) {
                console.error('Failed to load cat data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, authLoading, applyConfigFromServer]);

    useEffect(() => {
        if (equippedSkinId === DEFAULT_CAT_SKIN_ID && catItems.length > 0) {
            setEquippedSkinId(catItems[0].itemId);
        }
    }, [equippedSkinId, catItems]);

    const saveCat = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/cat', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    equippedItems: [],
                    equippedCatSkinId: equippedSkinId,
                    skinLoadouts: {},
                }),
            });
            if (res.ok) {
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
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Загружаем котов...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                <div className="text-6xl mb-4">🐱</div>
                <h2 className="text-xl font-black text-slate-800 uppercase italic">Кот Олег ждет тебя</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-xs">Чтобы выбрать кота, необходимо авторизоваться через VK.</p>
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
                            <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center w-full">
                                <CatOleg
                                    equippedItemIds={[]}
                                    ownedItems={[]}
                                    catSkinLottieSrc={resolveCatSkinLottieUrl(equippedSkinId, catItems)}
                                    size="lg"
                                    interactive={true}
                                />
                                <div className="mt-8 w-full max-w-md flex flex-col items-stretch gap-3 px-1">
                                    <div className="px-6 py-2.5 bg-slate-50 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 text-center leading-snug">
                                        Выбранный кот из{' '}
                                        <Link to="/shop" className="text-primary hover:underline">магазина</Link>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm rounded-2xl px-4 md:px-5 font-black text-[10px] uppercase tracking-widest shadow-md shadow-primary/20"
                                            onClick={saveCat}
                                            disabled={saving}
                                        >
                                            {saving ? <span className="loading loading-spinner loading-xs" /> : 'Сохранить'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-lg shadow-slate-200/50 p-6 border border-slate-50">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Купленные коты</h3>

                            {catItems.length === 0 ? (
                                <div className="text-center py-12 px-6 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-tight leading-relaxed">
                                        Пока нет купленных котов.<br />
                                        Загляни в <Link to="/shop" className="text-primary hover:underline">магазин</Link>.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {catItems.map((ui) => {
                                        const equipped = ui.itemId === equippedSkinId;
                                        return (
                                            <button
                                                key={ui.id}
                                                onClick={() => setEquippedSkinId(ui.itemId)}
                                                className={`flex flex-col items-stretch gap-2 p-2 pt-3 pb-3 rounded-[1.5rem] border-2 transition-all relative min-h-0 ${equipped ? 'border-primary bg-primary/5' : 'border-slate-50 hover:border-slate-100 bg-slate-50/50'}`}
                                            >
                                                <div className="relative mx-auto w-full max-w-[5.5rem] sm:max-w-[6.25rem] md:max-w-[7rem] aspect-[2/3] shrink-0 overflow-hidden rounded-xl bg-slate-100/60 flex items-center justify-center">
                                                    {(() => {
                                                        const lottieSrc =
                                                            (ui.item.catSkinLottieUrl && encodeURI(ui.item.catSkinLottieUrl)) ||
                                                            getFallbackCatSkinLottieUrl(ui.itemId) ||
                                                            null;
                                                        if (lottieSrc) {
                                                            return (
                                                                <div className="absolute inset-1 flex items-center justify-center pointer-events-none">
                                                                    <DotLottieReact
                                                                        src={lottieSrc}
                                                                        loop
                                                                        autoplay
                                                                        style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                                                                    />
                                                                </div>
                                                            );
                                                        }
                                                        if (ui.item.icon?.startsWith('/') || ui.item.icon?.startsWith('http')) {
                                                            return <img src={ui.item.icon} className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] object-contain" alt="" />;
                                                        }
                                                        return <span className="text-3xl md:text-4xl">{ui.item.icon}</span>;
                                                    })()}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter truncate w-full px-1 text-center leading-tight">{ui.item.name}</span>
                                                {equipped && (
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] shadow-lg shadow-primary/30">OK</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                </div>
            </main>
        </div>
    );
}
