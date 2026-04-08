import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { ShopItem, ShopItemType, CatWearSlot, CatWearLayout } from '@/types';
import CatWearPreview from '@/components/cat/CatWearPreview';
import {
    CAT_WEAR_SLOTS,
    DEFAULT_SLOT_LAYOUTS,
    mergeWearLayout,
} from '@/lib/catWear';

const TYPES: { id: ShopItemType; label: string }[] = [
    { id: 'BACKGROUND', label: 'Фоны' },
    { id: 'BADGE', label: 'Значки' },
    { id: 'CAT_ITEM', label: 'Одежда кота' },
    { id: 'CAT_SKIN', label: 'Скин кота (Lottie)' },
    { id: 'ACHIEVEMENT', label: 'Достижения (товар)' },
];

const defaultLayoutFor = (slot: CatWearSlot): CatWearLayout => ({
    ...DEFAULT_SLOT_LAYOUTS[slot],
});

export default function ManagementShopPage() {
    const { isComsostav, loading } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [fetching, setFetching] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
        price: 100,
        type: 'BACKGROUND' as ShopItemType,
        icon: '',
        imageUrl: '',
        requiresFighter: false,
        catWearSlot: 'HAT' as CatWearSlot,
        catWearLayout: defaultLayoutFor('HAT'),
        catSkinLottieUrl: '',
    });

    const isCatType = form.type === 'CAT_ITEM';
    const isCatSkinType = form.type === 'CAT_SKIN';

    useEffect(() => {
        if (!loading && !isComsostav) navigate('/');
    }, [loading, isComsostav, navigate]);

    useEffect(() => {
        if (!isComsostav) return;
        fetch('/api/shop')
            .then((r) => r.json())
            .then((data) => {
                setItems(data);
                setFetching(false);
            })
            .catch(() => setFetching(false));
    }, [isComsostav]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) setForm((f) => ({ ...f, imageUrl: data.url }));
        } finally {
            setUploading(false);
        }
    };

    const setLayoutField = <K extends keyof CatWearLayout>(
        key: K,
        value: CatWearLayout[K],
    ) => {
        setForm((f) => ({
            ...f,
            catWearLayout: { ...f.catWearLayout, [key]: value },
        }));
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            name: '',
            description: '',
            price: 100,
            type: 'BACKGROUND',
            icon: '',
            imageUrl: '',
            requiresFighter: false,
            catWearSlot: 'HAT',
            catWearLayout: defaultLayoutFor('HAT'),
            catSkinLottieUrl: '',
        });
    };

    const startEdit = (item: ShopItem) => {
        if (item.type === 'CAT_ITEM') {
            setEditingId(item.id);
            const slot = (item.catWearSlot as CatWearSlot) || 'HAT';
            setForm({
                name: item.name,
                description: item.description,
                price: item.price,
                type: 'CAT_ITEM',
                icon: item.icon || '',
                imageUrl: item.imageUrl || '',
                requiresFighter: item.requiresFighter,
                catWearSlot: slot,
                catWearLayout: mergeWearLayout(slot, item.catWearLayout),
                catSkinLottieUrl: '',
            });
            return;
        }
        if (item.type === 'CAT_SKIN') {
            setEditingId(item.id);
            setForm({
                name: item.name,
                description: item.description,
                price: item.price,
                type: 'CAT_SKIN',
                icon: item.icon || '',
                imageUrl: item.imageUrl || '',
                requiresFighter: item.requiresFighter,
                catWearSlot: 'HAT',
                catWearLayout: defaultLayoutFor('HAT'),
                catSkinLottieUrl: item.catSkinLottieUrl || '',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const payload: Record<string, unknown> = {
                name: form.name,
                description: form.description,
                price: form.price,
                type: form.type,
                icon: form.icon || null,
                imageUrl: form.imageUrl || null,
                requiresFighter: form.requiresFighter,
            };
            if (isCatType) {
                payload.catWearSlot = form.catWearSlot;
                payload.catWearLayout = form.catWearLayout;
            }
            if (isCatSkinType) {
                payload.catSkinLottieUrl = form.catSkinLottieUrl.trim() || null;
            }

            const url = editingId
                ? `/api/shop-items/${editingId}`
                : '/api/shop-items';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const saved = (await res.json()) as ShopItem;
                setItems((prev) => {
                    if (editingId) {
                        return prev.map((x) =>
                            x.id === saved.id ? saved : x,
                        );
                    }
                    return [saved, ...prev];
                });
                resetForm();
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex flex-col pb-20">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3 flex items-center gap-2">
                <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>←</button>
                <h1 className="text-base font-bold">🛍️ Управление магазином</h1>
            </header>

            <main className="px-4 py-4 space-y-6">
                <section className="card bg-base-100 shadow-sm border border-primary/20">
                    <form className="card-body p-4 space-y-3" onSubmit={handleSubmit}>
                        <h2 className="card-title text-sm">
                            {editingId ? '✏️ Редактировать товар' : 'Новый товар'}
                        </h2>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="mgmt-field">
                                <span className="mgmt-label">Тип</span>
                                <select
                                    className="mgmt-input"
                                    value={form.type}
                                    onChange={(e) => {
                                        const t = e.target.value as ShopItemType;
                                        setForm((f) => ({
                                            ...f,
                                            type: t,
                                            catWearLayout:
                                                t === 'CAT_ITEM'
                                                    ? defaultLayoutFor(f.catWearSlot)
                                                    : f.catWearLayout,
                                            catSkinLottieUrl:
                                                t === 'CAT_SKIN' ? f.catSkinLottieUrl : '',
                                        }));
                                    }}
                                >
                                    {TYPES.map((t) => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mgmt-field">
                                <span className="mgmt-label">Цена (🪙)</span>
                                <input
                                    type="number" required className="mgmt-input"
                                    value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) })}
                                />
                            </div>
                        </div>

                        <div className="mgmt-field">
                            <span className="mgmt-label">Название</span>
                            <input
                                type="text" required className="mgmt-input"
                                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        <div className="mgmt-field">
                            <span className="mgmt-label">Описание</span>
                            <textarea
                                className="mgmt-input" rows={2}
                                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="mgmt-field">
                            <span className="mgmt-label">
                                {isCatType
                                    ? 'Изображение одежды (PNG с прозрачностью)'
                                    : isCatSkinType
                                      ? 'Превью-обложка (опционально)'
                                      : 'Загрузить изображение (для фонов/аватарок)'}
                            </span>
                            <div className="flex gap-2">
                                <input
                                    type="file" accept="image/*" className="mgmt-file w-full"
                                    onChange={handleFileUpload}
                                />
                                {uploading && <span className="loading loading-spinner loading-xs" />}
                            </div>
                            {form.imageUrl && (
                                <div className="mt-2 w-full h-20 rounded-lg overflow-hidden border border-base-300">
                                    <img src={form.imageUrl} className="w-full h-full object-cover" alt="" />
                                </div>
                            )}
                        </div>

                        <div className="mgmt-field">
                            <span className="mgmt-label">
                                {isCatType || isCatSkinType
                                    ? 'Эмодзи в списке'
                                    : 'Иконка (эмодзи, для значков)'}
                            </span>
                            <input
                                type="text" className="mgmt-input"
                                value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                            />
                        </div>

                        {isCatSkinType && (
                            <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-3 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary/80">
                                    Lottie JSON (путь из public)
                                </p>
                                <input
                                    type="text"
                                    className="mgmt-input w-full"
                                    placeholder="/lottie/cats/example.json"
                                    value={form.catSkinLottieUrl}
                                    onChange={(e) => setForm({ ...form, catSkinLottieUrl: e.target.value })}
                                />
                                {form.catSkinLottieUrl.trim().startsWith('/') && (
                                    <div className="w-44 aspect-[200/280] mx-auto rounded-2xl overflow-hidden border border-base-300 bg-base-200">
                                        <CatWearPreview
                                            skinLottieSrc={form.catSkinLottieUrl.trim()}
                                            layout={form.catWearLayout}
                                            slot={form.catWearSlot}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {isCatType && (
                            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                    Привязка к коту (канвас 200×200, координаты 0–1)
                                </p>
                                <div className="mgmt-field">
                                    <span className="mgmt-label">Слот</span>
                                    <select
                                        className="mgmt-input"
                                        value={form.catWearSlot}
                                        onChange={(e) => {
                                            const slot = e.target.value as CatWearSlot;
                                            setForm((f) => ({
                                                ...f,
                                                catWearSlot: slot,
                                                catWearLayout: defaultLayoutFor(slot),
                                            }));
                                        }}
                                    >
                                        {CAT_WEAR_SLOTS.map((s) => (
                                            <option key={s.id} value={s.id}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <CatWearPreview
                                    imageUrl={form.imageUrl}
                                    icon={form.icon}
                                    layout={form.catWearLayout}
                                    slot={form.catWearSlot}
                                    previewItemId={editingId}
                                    skinLottieSrc={null}
                                />

                                <div className="grid grid-cols-1 gap-2 text-[11px]">
                                    <label className="flex flex-col gap-1">
                                        <span className="opacity-70">Центр X ({form.catWearLayout.anchorX.toFixed(2)})</span>
                                        <input
                                            type="range" min={0} max={1} step={0.01}
                                            value={form.catWearLayout.anchorX}
                                            onChange={(e) => setLayoutField('anchorX', parseFloat(e.target.value))}
                                            className="range range-xs range-primary"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="opacity-70">Центр Y ({form.catWearLayout.anchorY.toFixed(2)})</span>
                                        <input
                                            type="range" min={0} max={1} step={0.01}
                                            value={form.catWearLayout.anchorY}
                                            onChange={(e) => setLayoutField('anchorY', parseFloat(e.target.value))}
                                            className="range range-xs range-primary"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="opacity-70">Ширина на холсте ({form.catWearLayout.widthPercent.toFixed(2)})</span>
                                        <input
                                            type="range" min={0.08} max={0.95} step={0.01}
                                            value={form.catWearLayout.widthPercent}
                                            onChange={(e) => setLayoutField('widthPercent', parseFloat(e.target.value))}
                                            className="range range-xs range-primary"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="opacity-70">Слой (z-index) ({form.catWearLayout.zIndex})</span>
                                        <input
                                            type="range" min={1} max={50} step={1}
                                            value={form.catWearLayout.zIndex}
                                            onChange={(e) => setLayoutField('zIndex', parseInt(e.target.value, 10))}
                                            className="range range-xs range-primary"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="opacity-70">Поворот ° ({form.catWearLayout.rotationDeg ?? 0})</span>
                                        <input
                                            type="range" min={-45} max={45} step={1}
                                            value={form.catWearLayout.rotationDeg ?? 0}
                                            onChange={(e) => setLayoutField('rotationDeg', parseFloat(e.target.value))}
                                            className="range range-xs range-primary"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="form-control">
                            <label className="cursor-pointer label justify-start gap-3">
                                <input
                                    type="checkbox" className="checkbox checkbox-xs"
                                    checked={form.requiresFighter}
                                    onChange={(e) => setForm({ ...form, requiresFighter: e.target.checked })}
                                />
                                <span className="label-text text-sm">Только для бойцов</span>
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button className="btn btn-primary btn-sm flex-1" disabled={processing || uploading}>
                                {editingId ? 'Сохранить' : 'Добавить товар'}
                            </button>
                            {editingId && (
                                <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>
                                    Отмена
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm font-semibold px-1 text-base-content/70">Товары в продаже</h2>
                    {fetching ? (
                        <div className="animate-pulse space-y-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-base-100 rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {items.map((item) => (
                                <div key={item.id} className="card card-side bg-base-100 shadow-sm overflow-hidden min-h-20 border border-base-100">
                                    <figure className="w-20 bg-base-200 shrink-0">
                                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl flex items-center justify-center h-full">{item.icon}</span>}
                                    </figure>
                                    <div className="card-body p-2 justify-center min-w-0">
                                        <div className="flex justify-between items-center gap-2">
                                            <p className="font-bold text-xs truncate">{item.name}</p>
                                            <span className="badge badge-warning badge-xs shrink-0">{item.price} 🪙</span>
                                        </div>
                                        <p className="text-[10px] text-base-content/50 uppercase truncate">{item.type}</p>
                                        {(item.type === 'CAT_ITEM' || item.type === 'CAT_SKIN') && (
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-outline btn-primary mt-1 w-fit"
                                                onClick={() => startEdit(item)}
                                            >
                                                {item.type === 'CAT_SKIN' ? 'Редактировать скин' : 'Редактировать примерку'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
