import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Achievement } from '@/types';

type ConditionMetric =
    | 'shop_purchases'
    | 'cat_items_owned'
    | 'events_attended'
    | 'events_organized'
    | 'coins_balance';

const CONDITION_OPTIONS: Array<{ value: ConditionMetric; label: string; hint: string }> = [
    { value: 'shop_purchases', label: 'Покупки в магазине', hint: 'Например: купить 5 вещей' },
    { value: 'cat_items_owned', label: 'Предметы для кота', hint: 'Например: купить 1 предмет для кота' },
    { value: 'events_attended', label: 'Подтвержденные посещения мероприятий', hint: 'Например: посетить 3 мероприятия' },
    { value: 'events_organized', label: 'Организованные мероприятия', hint: 'Например: организовать 2 мероприятия' },
    { value: 'coins_balance', label: 'Баланс монет', hint: 'Например: накопить 1000 монет' },
];

const toConditionLabel = (condition: string): string => {
    if (!condition) return 'Без автоусловия';
    const parsed = condition.match(/^AUTO:([a-z_]+):(gte):(\d+)$/i);
    if (!parsed) return condition;
    const metric = parsed[1] as ConditionMetric;
    const threshold = parsed[3];
    const item = CONDITION_OPTIONS.find((opt) => opt.value === metric);
    return item ? `${item.label}: >= ${threshold}` : condition;
};

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
        conditionMetric: 'shop_purchases' as ConditionMetric,
        conditionValue: 1,
    });

    useEffect(() => {
        if (!loading && !isComsostav) navigate('/');
    }, [loading, isComsostav]);

    useEffect(() => {
        if (!isComsostav) return;
        fetch('/api/achievements')
            .then((r) => r.json())
            .then((data) => { setAchievements(Array.isArray(data) ? data : []); setFetching(false); })
            .catch(() => setFetching(false));
    }, [isComsostav]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const res = await fetch('/api/achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    icon: form.icon,
                    condition: `AUTO:${form.conditionMetric}:gte:${form.conditionValue}`,
                }),
            });
            if (res.ok) {
                const newAch = await res.json();
                setAchievements((prev) => [newAch, ...prev]);
                setForm({
                    name: '',
                    description: '',
                    icon: '🏆',
                    conditionMetric: 'shop_purchases',
                    conditionValue: 1,
                });
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
                            <div className="mgmt-field w-24 shrink-0">
                                <span className="mgmt-label">Иконка</span>
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
                                    type="text" className="mgmt-input mt-2 text-center font-mono text-xs py-1"
                                    placeholder="Emoji"
                                    value={form.icon.length <= 2 ? form.icon : ''}
                                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                />
                            </div>
                            <div className="mgmt-field flex-1 min-w-0">
                                <span className="mgmt-label">Название</span>
                                <input
                                    type="text" required className="mgmt-input"
                                    placeholder="Напр: Первые шаги"
                                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mgmt-field">
                            <span className="mgmt-label">Описание</span>
                            <textarea
                                className="mgmt-input" rows={3}
                                placeholder="За что дается эта ачивка?"
                                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="mgmt-field sm:col-span-2">
                                <span className="mgmt-label">Тип условия</span>
                                <select
                                    className="mgmt-input"
                                    value={form.conditionMetric}
                                    onChange={(e) => setForm({ ...form, conditionMetric: e.target.value as ConditionMetric })}
                                >
                                    {CONDITION_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-base-content/60 mt-1">
                                    {CONDITION_OPTIONS.find((opt) => opt.value === form.conditionMetric)?.hint}
                                </p>
                            </div>
                            <div className="mgmt-field">
                                <span className="mgmt-label">Порог</span>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    className="mgmt-input"
                                    value={form.conditionValue}
                                    onChange={(e) => setForm({ ...form, conditionValue: Math.max(1, Number(e.target.value) || 1) })}
                                />
                            </div>
                        </div>

                        <div className="text-[10px] text-base-content/70">
                            Автопроверка: {toConditionLabel(`AUTO:${form.conditionMetric}:gte:${form.conditionValue}`)}
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
                                    <div className="badge badge-ghost badge-xs text-[8px] flex-none">{toConditionLabel(a.condition)}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
