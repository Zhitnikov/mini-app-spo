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

    const moderate = async (eventId: string, action: 'approve' | 'reject') => {
        setProcessing(eventId);
        try {
            const res = await fetch(`/api/events/${eventId}/moderate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
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
                                    <div className="flex gap-2 mt-2">
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
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
