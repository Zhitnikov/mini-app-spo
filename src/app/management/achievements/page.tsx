import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Achievement } from '@/types';

export default function ManagementAchievementsPage() {
    const { isComsostav, loading } = useAuth();
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [fetching, setFetching] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        icon: '🏆',
        condition: '',
    });

    useEffect(() => {
        if (!loading && !isComsostav) navigate('/');
    }, [loading, isComsostav]);

    useEffect(() => {
        if (!isComsostav) return;
        fetch('/api/achievements')
            .then((r) => r.json())
            .then((data) => { setAchievements(data); setFetching(false); })
            .catch(() => setFetching(false));
    }, [isComsostav]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const res = await fetch('/api/achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const newAch = await res.json();
                setAchievements((prev) => [newAch, ...prev]);
                setForm({ name: '', description: '', icon: '🏆', condition: '' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex flex-col pb-20 md:pb-0">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3 flex items-center gap-2">
                <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>←</button>
                <h1 className="text-base font-bold">🏆 Управление ачивками</h1>
            </header>

            <main className="px-4 py-4 space-y-6">
                <section className="card bg-base-100 shadow-sm border border-primary/20">
                    <form className="card-body p-4 space-y-3" onSubmit={handleSubmit}>
                        <h2 className="card-title text-sm">Новое достижение</h2>

                        <div className="flex gap-4">
                            <div className="form-control w-20">
                                <label className="label label-text text-[10px] py-1 font-black uppercase">Иконка</label>
                                <div
                                    className="w-full h-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-2xl cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => document.getElementById('ach-upload')?.click()}
                                >
                                    {form.icon.length > 2 ? <img src={form.icon} className="w-full h-full object-contain p-1" /> : form.icon}
                                </div>
                                <input
                                    id="ach-upload" type="file" className="hidden" accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                        const data = await res.json();
                                        if (data.url) setForm({ ...form, icon: data.url });
                                    }}
                                />
                                <input
                                    type="text" className="input input-xs input-bordered mt-1 text-center font-mono"
                                    placeholder="Emoji"
                                    value={form.icon.length <= 2 ? form.icon : ''}
                                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                />
                            </div>
                            <div className="form-control flex-1">
                                <label className="label label-text text-[10px] py-1 font-black uppercase">Название</label>
                                <input
                                    type="text" required className="input input-sm input-bordered"
                                    placeholder="Напр: Первые шаги"
                                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label label-text text-[10px] py-1 font-black uppercase font-black uppercase">Описание</label>
                            <textarea
                                className="textarea textarea-sm textarea-bordered" rows={2}
                                placeholder="За что дается эта ачивка?"
                                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <button className="btn btn-primary btn-sm w-full rounded-xl uppercase font-black text-[10px] tracking-widest mt-2" disabled={processing}>
                            {processing ? <span className="loading loading-xs" /> : '🚀 Создать достижение'}
                        </button>
                    </form>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm font-semibold px-1 text-base-content/70">Существующие ачивки</h2>
                    {fetching ? (
                        <div className="animate-pulse space-y-2">
                            {[1, 2].map(i => <div key={i} className="h-16 bg-base-100 rounded-xl" />)}
                        </div>
                    ) : achievements.map((a) => (
                        <div key={a.id} className="card bg-base-100 shadow-sm">
                            <div className="card-body p-3 flex-row items-center gap-3">
                                <div className="text-3xl flex-none">{a.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{a.name}</p>
                                    <p className="text-[10px] text-base-content/60 line-clamp-2">{a.description}</p>
                                </div>
                                {a.condition && (
                                    <div className="badge badge-ghost badge-xs text-[8px] flex-none">{a.condition}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
