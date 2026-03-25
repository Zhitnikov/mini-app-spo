import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { ShopItem, ShopItemType } from '@/types';

const TYPES: { id: ShopItemType; label: string }[] = [
    { id: 'BACKGROUND', label: 'Фоны' },
    { id: 'BADGE', label: 'Значки' },
    { id: 'CAT_ITEM', label: 'Для Кота' },
];

export default function ManagementShopPage() {
    const { isComsostav, loading } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [fetching, setFetching] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        price: 100,
        type: 'BACKGROUND' as ShopItemType,
        icon: '',
        imageUrl: '',
        requiresFighter: false,
    });

    useEffect(() => {
        if (!loading && !isComsostav) navigate('/');
    }, [loading, isComsostav]);

    useEffect(() => {
        if (!isComsostav) return;
        fetch('/api/shop')
            .then((r) => r.json())
            .then((data) => { setItems(data); setFetching(false); })
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
            if (data.url) setForm({ ...form, imageUrl: data.url });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const res = await fetch('/api/shop-items', { // Use a separate management API
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const newItem = await res.json();
                setItems((prev) => [newItem, ...prev]);
                setForm({ ...form, name: '', description: '', imageUrl: '', icon: '' });
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
                        <h2 className="card-title text-sm">Новый товар</h2>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="form-control">
                                <label className="label label-text text-[10px] py-1">Тип</label>
                                <select
                                    className="select select-sm select-bordered"
                                    value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                                >
                                    {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label label-text text-[10px] py-1">Цена (🪙)</label>
                                <input
                                    type="number" required className="input input-sm input-bordered"
                                    value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label label-text text-[10px] py-1">Название</label>
                            <input
                                type="text" required className="input input-sm input-bordered"
                                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label label-text text-[10px] py-1">Описание</label>
                            <textarea
                                className="textarea textarea-sm textarea-bordered" rows={2}
                                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label label-text text-[10px] py-1">Загрузить изображение (для фонов/аватарок)</label>
                            <div className="flex gap-2">
                                <input
                                    type="file" className="file-input file-input-bordered file-input-sm w-full"
                                    onChange={handleFileUpload}
                                />
                                {uploading && <span className="loading loading-spinner loading-xs" />}
                            </div>
                            {form.imageUrl && (
                                <div className="mt-2 w-full h-20 rounded-lg overflow-hidden border border-base-300">
                                    <img src={form.imageUrl} className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label label-text text-[10px] py-1">Иконка (эмодзи, для значков/кота)</label>
                            <input
                                type="text" className="input input-sm input-bordered"
                                value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                            />
                        </div>

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

                        <button className="btn btn-primary btn-sm w-full" disabled={processing || uploading}>
                            Добавить товар
                        </button>
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
                                <div key={item.id} className="card card-side bg-base-100 shadow-sm overflow-hidden h-20 border border-base-100">
                                    <figure className="w-20 bg-base-200">
                                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <span className="text-3xl">{item.icon}</span>}
                                    </figure>
                                    <div className="card-body p-2 justify-center">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-xs">{item.name}</p>
                                            <span className="badge badge-warning badge-xs">{item.price} 🪙</span>
                                        </div>
                                        <p className="text-[10px] text-base-content/50 uppercase">{item.type}</p>
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
