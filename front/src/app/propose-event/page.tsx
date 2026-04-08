import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const MapPicker = lazy(() => import('@/components/MapPickerComponent'));

export default function ProposeEventPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [editableEventId, setEditableEventId] = useState<string | null>(null);
    const [moderationComment, setModerationComment] = useState('');
    const [form, setForm] = useState<any>({
        title: '',
        subtitle: '',
        shortDescription: '',
        description: '',
        dateLabel: '',
        date: '',
        location: '',
        latitude: '',
        longitude: '',
        imageUrl: '',
        pollQuestion: '',
    });

    const handleLocationChange = (lat: number, lng: number) => {
        setForm((prev: any) => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
    };

    useEffect(() => {
        if (!user) return;
        fetch('/api/events/my/drafts?status=NEEDS_REVISION')
            .then((r) => r.json())
            .then((data) => {
                if (!Array.isArray(data) || data.length === 0) return;
                const draft = data[0];
                setEditableEventId(draft.id);
                setModerationComment(draft.moderationComment || '');
                setForm({
                    title: draft.title || '',
                    subtitle: draft.subtitle || '',
                    shortDescription: draft.shortDescription || '',
                    description: draft.description || '',
                    dateLabel: draft.dateLabel || '',
                    date: draft.date ? new Date(draft.date).toISOString().slice(0, 16) : '',
                    location: draft.location || '',
                    latitude: draft.latitude ? String(draft.latitude) : '',
                    longitude: draft.longitude ? String(draft.longitude) : '',
                    imageUrl: draft.imageUrl || '',
                    pollQuestion: draft.pollQuestion || '',
                });
            })
            .catch(() => null);
    }, [user]);

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev: any) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || submitting) return;
        setSubmitting(true);
        try {
            const body = {
                ...form,
                latitude: form.latitude ? parseFloat(form.latitude) : null,
                longitude: form.longitude ? parseFloat(form.longitude) : null,
                date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
            };

            const res = await fetch(editableEventId ? `/api/events/${editableEventId}/resubmit` : '/api/events', {
                method: editableEventId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => navigate('/'), 2000);
            } else {
                const data = await res.json();
                alert(data.error || 'Ошибка при отправке');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col bg-slate-50 min-h-full pb-20">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center gap-4">
                <button className="btn btn-ghost btn-sm btn-square" onClick={() => navigate(-1)}>←</button>
                <h1 className="text-sm font-bold tracking-tight text-slate-800">Предложение мероприятия</h1>
            </header>

            <main className="p-4 max-w-2xl mx-auto w-full">
                {success ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center shadow-xl shadow-slate-200/50 border border-slate-50">
                        <div className="text-6xl mb-6">🎉</div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Отправлено!</h2>
                        <p className="text-slate-500">Ваша заявка принята и ожидает модерации.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {editableEventId && (
                            <div className="alert alert-warning">
                                <span>Заявка на доработке: {moderationComment || 'Проверьте правки и отправьте повторно.'}</span>
                            </div>
                        )}
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 space-y-5">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Основное</h2>

                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Название *</label>
                                    <input
                                        type="text" required maxLength={100}
                                        placeholder="Как назовём?"
                                        className="input input-bordered rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                                        value={form.title} onChange={handleChange('title')}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Подзаголовок</label>
                                    <input
                                        type="text" maxLength={200}
                                        placeholder="Короткий слоган или девиз"
                                        className="input input-bordered rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                                        value={form.subtitle} onChange={handleChange('subtitle')}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Краткое описание</label>
                                    <textarea
                                        rows={2} maxLength={500}
                                        placeholder="Пара предложений для ленты"
                                        className="textarea textarea-bordered rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                                        value={form.shortDescription} onChange={handleChange('shortDescription')}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Полное описание *</label>
                                    <textarea
                                        required rows={4}
                                        placeholder="Подробно: что, зачем и для кого"
                                        className="textarea textarea-bordered rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                                        value={form.description} onChange={handleChange('description')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 space-y-5">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Время и место</h2>

                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Наглядная дата</label>
                                    <input
                                        type="text"
                                        placeholder="Напр: 20 мая, 19:00"
                                        className="input input-bordered rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                                        value={form.dateLabel} onChange={handleChange('dateLabel')}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Точная дата для системы</label>
                                    <input
                                        type="datetime-local"
                                        className="input input-bordered rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                                        value={form.date} onChange={handleChange('date')}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Место (адрес или название) *</label>
                                    <input
                                        type="text" required
                                        placeholder="Где встречаемся?"
                                        className="input input-bordered rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                                        value={form.location} onChange={handleChange('location')}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Метка на карте</label>
                                    <Suspense fallback={<div className="h-64 bg-slate-50 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-300">Загрузка карты...</div>}>
                                        <MapPicker
                                            lat={form.latitude ? parseFloat(form.latitude) : null}
                                            lng={form.longitude ? parseFloat(form.longitude) : null}
                                            onChange={handleLocationChange}
                                        />
                                    </Suspense>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <input type="text" readOnly placeholder="Lat" className="input input-xs bg-slate-50 border-none text-[10px]" value={form.latitude} />
                                        <input type="text" readOnly placeholder="Lng" className="input input-xs bg-slate-50 border-none text-[10px]" value={form.longitude} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic mt-2 px-1">☝️ Кликните на карту, чтобы поставить маркер</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 space-y-5">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Дополнительно</h2>

                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Обложка мероприятия</label>
                                    <div className="flex flex-col gap-3">
                                        <div
                                            className="group w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all bg-slate-50/50 overflow-hidden relative"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            {form.imageUrl ? (
                                                <img src={form.imageUrl} alt="Превью" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center">
                                                    <span className="text-3xl mb-1 block">🖼️</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Кликните для загрузки фото</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest">
                                                Выбрать файл
                                            </div>
                                        </div>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                const formData = new FormData();
                                                formData.append('file', file);

                                                try {
                                                    const res = await fetch('/api/upload', {
                                                        method: 'POST',
                                                        body: formData,
                                                    });
                                                    const data = await res.json();
                                                    if (data.url) {
                                                        setForm((prev: any) => ({ ...prev, imageUrl: data.url }));
                                                    }
                                                } catch (err) {
                                                    console.error('Upload failed:', err);
                                                }
                                            }}
                                        />
                                        {form.imageUrl && (
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs text-slate-400 hover:text-error font-bold self-center"
                                                onClick={() => setForm((prev: any) => ({ ...prev, imageUrl: '' }))}
                                            >
                                                × Сбросить изображение
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label label-text text-[11px] font-bold text-slate-500 uppercase px-1">Вопрос опроса</label>
                                    <input
                                        type="text" maxLength={100}
                                        placeholder="Напр: Придёшь на мероприятие?"
                                        className="input input-bordered rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                                        value={form.pollQuestion} onChange={handleChange('pollQuestion')}
                                    />
                                    <p className="text-[10px] text-slate-400 italic mt-2 px-2">Варианты ответов: "Да", "Нет", "Позже"</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`btn w-full h-14 rounded-2xl border-none shadow-lg shadow-slate-200 text-white font-bold text-sm transition-all active:scale-[0.98] ${submitting ? 'bg-slate-300' : 'bg-slate-800 hover:bg-slate-900'
                                    }`}
                            >
                                {submitting ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    'Отправить на модерацию'
                                )}
                            </button>

                            <p className="text-center text-[10px] text-slate-400 font-medium pb-10">
                                ℹ️ Все мероприятия проходят ручную проверку комсоставом перед публикацией.
                            </p>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}
