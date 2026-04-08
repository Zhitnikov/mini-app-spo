import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Event } from '@/types';

export default function ManagementEventsPage() {
    const { isComsostav, loading } = useAuth();
    const navigate = useNavigate();
    const [pending, setPending] = useState<Event[]>([]);
    const [approved, setApproved] = useState<Event[]>([]);
    const [tab, setTab] = useState<'pending' | 'approved'>('pending');
    const [fetching, setFetching] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [checkerModalEvent, setCheckerModalEvent] = useState<Event | null>(null);
    const [checkerQuery, setCheckerQuery] = useState('');
    const [checkerResults, setCheckerResults] = useState<Array<{ id: string; fullName: string; role: string; vkId: number }>>([]);
    const [checkerLoading, setCheckerLoading] = useState(false);
    const [editEvent, setEditEvent] = useState<Event | null>(null);
    const [editForm, setEditForm] = useState<any>(null);

    useEffect(() => {
        if (!loading && !isComsostav) navigate('/');
    }, [loading, isComsostav]);

    useEffect(() => {
        if (!isComsostav) return;
        Promise.all([
            fetch('/api/events?status=PENDING').then((r) => r.json()),
            fetch('/api/events?status=APPROVED').then((r) => r.json()),
        ]).then(([p, a]) => {
            setPending(Array.isArray(p) ? p : []);
            setApproved(Array.isArray(a) ? a : []);
            setFetching(false);
        }).catch(() => setFetching(false));
    }, [isComsostav]);

    const moderate = async (eventId: string, action: 'approve' | 'reject' | 'revision') => {
        const comment = action === 'revision' ? prompt('Комментарий для доработки:') || '' : '';
        if (action === 'revision' && !comment.trim()) return;
        setProcessing(eventId);
        try {
            const res = await fetch(`/api/events/${eventId}/moderate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, comment }),
            });
            if (res.ok) {
                const updated = await res.json();
                if (action === 'approve') {
                    setPending((prev) => prev.filter((e) => e.id !== eventId));
                    setApproved((prev) => [updated, ...prev]);
                } else {
                    setPending((prev) => prev.filter((e) => e.id !== eventId));
                }
            }
        } finally {
            setProcessing(null);
        }
    };

    useEffect(() => {
        if (!checkerModalEvent) return;
        const handle = setTimeout(async () => {
            setCheckerLoading(true);
            try {
                const params = new URLSearchParams();
                if (checkerQuery.trim()) params.set('q', checkerQuery.trim());
                const res = await fetch(`/api/users?${params.toString()}`);
                const data = await res.json();
                setCheckerResults(Array.isArray(data) ? data : []);
            } finally {
                setCheckerLoading(false);
            }
        }, 250);
        return () => clearTimeout(handle);
    }, [checkerModalEvent, checkerQuery]);

    const assignChecker = async (eventId: string, userId: string) => {
        await fetch(`/api/events/${eventId}/checkers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        alert('Проверяющий назначен');
    };

    const confirmAttendee = async (eventId: string, userId: string) => {
        await fetch(`/api/events/${eventId}/attend`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
    };

    const deleteEvent = async (eventId: string) => {
        if (!confirm('Удалить мероприятие?')) return;
        await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
        setApproved((prev) => prev.filter((e) => e.id !== eventId));
    };

    const saveAdminEdit = async () => {
        if (!editEvent || !editForm) return;
        const res = await fetch(`/api/events/${editEvent.id}/admin-edit`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        if (!res.ok) return alert('Не удалось сохранить изменения');
        const updated = await res.json();
        setPending((prev) => prev.map((e) => e.id === updated.id ? updated : e));
        setApproved((prev) => prev.map((e) => e.id === updated.id ? updated : e));
        setEditEvent(null);
        setEditForm(null);
    };

    const displayList = tab === 'pending' ? pending : approved;

    return (
        <div className="flex flex-col pb-20 md:pb-0">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>←</button>
                    <h1 className="text-base font-bold">📋 Мероприятия</h1>
                </div>
                <div className="flex gap-1">
                    <button
                        className={`btn btn-sm flex-1 gap-1 ${tab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setTab('pending')}
                    >
                        На модерации
                        {pending.length > 0 && <span className="badge badge-xs badge-error">{pending.length}</span>}
                    </button>
                    <button
                        className={`btn btn-sm flex-1 ${tab === 'approved' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setTab('approved')}
                    >
                        Одобренные
                    </button>
                </div>
            </header>

            <main className="px-4 py-4 space-y-3">
                {fetching ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => <div key={i} className="card bg-base-100 animate-pulse h-32" />)}
                    </div>
                ) : displayList.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">{tab === 'pending' ? '✅' : '📭'}</div>
                        <p className="text-base-content/60">
                            {tab === 'pending' ? 'Нет заявок на модерацию' : 'Нет мероприятий'}
                        </p>
                    </div>
                ) : (
                    displayList.map((event) => (
                        <div key={event.id} className="card bg-base-100 shadow-sm">
                            {event.imageUrl && (
                                <figure className="h-24 overflow-hidden rounded-t-2xl bg-base-200">
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                </figure>
                            )}
                            <div className="card-body p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-sm">{event.title}</p>
                                        <p className="text-xs text-base-content/60">{event.dateLabel} · {event.location}</p>
                                        <p className="text-xs text-base-content/70 mt-1 line-clamp-2">{event.shortDescription}</p>
                                    </div>
                                    <span className="badge badge-xs text-[10px] flex-none">
                                        {event.organizer?.fullName}
                                    </span>
                                </div>

                                {tab === 'pending' ? (
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        <a
                                            href={`/events/${event.id}`}
                                            className="btn btn-ghost btn-sm flex-1"
                                        >
                                            👁️ Просмотр
                                        </a>
                                        <button
                                            className="btn btn-success btn-sm flex-1 gap-1"
                                            onClick={() => moderate(event.id, 'approve')}
                                            disabled={processing === event.id}
                                        >
                                            {processing === event.id ? <span className="loading loading-xs" /> : '✅'} Одобрить
                                        </button>
                                        <button
                                            className="btn btn-error btn-sm btn-outline flex-1 gap-1"
                                            onClick={() => moderate(event.id, 'reject')}
                                            disabled={processing === event.id}
                                        >
                                            ❌ Отклонить
                                        </button>
                                        <button
                                            className="btn btn-warning btn-sm btn-outline flex-1 gap-1"
                                            onClick={() => moderate(event.id, 'revision')}
                                            disabled={processing === event.id}
                                        >
                                            ↩️ На доработку
                                        </button>
                                        <button className="btn btn-sm btn-outline flex-1" onClick={() => { setEditEvent(event); setEditForm({ ...event, date: event.date?.slice(0, 16) || '' }); }}>
                                            ✏️ Редактировать
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 mt-2">
                                        <a
                                            href={`/events/${event.id}`}
                                            className="btn btn-ghost btn-xs flex-1"
                                        >
                                            👁️ Просмотр
                                        </a>
                                        <button
                                            className="btn btn-error btn-xs btn-outline flex-1"
                                            onClick={() => deleteEvent(event.id)}
                                        >
                                            🗑️ Удалить
                                        </button>
                                        <button className="btn btn-xs btn-outline flex-1" onClick={() => { setCheckerModalEvent(event); setCheckerQuery(''); }}>
                                            👮 Назначить проверяющего
                                        </button>
                                        <button className="btn btn-xs btn-outline flex-1" onClick={() => { setEditEvent(event); setEditForm({ ...event, date: event.date?.slice(0, 16) || '' }); }}>
                                            ✏️ Редактировать
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>
            {checkerModalEvent && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-lg">
                        <h3 className="font-bold text-lg mb-2">Назначить проверяющего</h3>
                        <p className="text-sm text-base-content/60 mb-3">{checkerModalEvent.title}</p>
                        <input
                            className="input input-bordered w-full mb-3"
                            placeholder="Поиск по ФИО, роли, VK ID..."
                            value={checkerQuery}
                            onChange={(e) => setCheckerQuery(e.target.value)}
                        />
                        <div className="max-h-72 overflow-auto space-y-2">
                            {checkerLoading ? (
                                <div className="text-sm text-base-content/60">Поиск...</div>
                            ) : checkerResults.length === 0 ? (
                                <div className="text-sm text-base-content/60">Ничего не найдено</div>
                            ) : checkerResults.map((u) => (
                                <button
                                    key={u.id}
                                    className="w-full text-left p-3 rounded-xl border border-base-300 hover:bg-base-200"
                                    onClick={async () => {
                                        await assignChecker(checkerModalEvent.id, u.id);
                                        setCheckerModalEvent(null);
                                    }}
                                >
                                    <div className="font-semibold text-sm">{u.fullName}</div>
                                    <div className="text-xs text-base-content/60">VK {u.vkId} · {u.role}</div>
                                </button>
                            ))}
                        </div>
                        <div className="modal-action">
                            <button className="btn" onClick={() => setCheckerModalEvent(null)}>Закрыть</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setCheckerModalEvent(null)} />
                </dialog>
            )}
            {editEvent && editForm && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-xl">
                        <h3 className="font-bold text-lg mb-3">Редактирование мероприятия</h3>
                        <div className="space-y-2">
                            <input className="input input-bordered w-full" value={editForm.title || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="Название" />
                            <input className="input input-bordered w-full" value={editForm.location || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, location: e.target.value }))} placeholder="Локация" />
                            <input type="datetime-local" className="input input-bordered w-full" value={editForm.date || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, date: e.target.value }))} />
                            <textarea className="textarea textarea-bordered w-full" value={editForm.description || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Описание" />
                            <input className="input input-bordered w-full" value={editForm.imageUrl || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, imageUrl: e.target.value }))} placeholder="URL картинки" />
                            <input
                                type="file"
                                accept="image/*"
                                className="file-input file-input-bordered w-full"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                    const data = await res.json();
                                    if (data.url) setEditForm((p: any) => ({ ...p, imageUrl: data.url }));
                                }}
                            />
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-primary" onClick={saveAdminEdit}>Сохранить</button>
                            <button className="btn" onClick={() => { setEditEvent(null); setEditForm(null); }}>Отмена</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => { setEditEvent(null); setEditForm(null); }} />
                </dialog>
            )}
        </div>
    );
}
