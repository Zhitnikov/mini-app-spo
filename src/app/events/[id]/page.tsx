import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAuth } from '@/contexts/AuthContext';
import type { Event, EventAttendee } from '@/types';

const MapComponent = lazy(() => import('@/components/MapComponent'));

export default function EventDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [attending, setAttending] = useState(false);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        fetch(`/api/events/${id}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) return navigate('/');
                setEvent(data);
                if (user) {
                    const myAttendance = data.attendances?.find((a: EventAttendee) => a.userId === user.id);
                    if (myAttendance) setAttending(true);
                }
                setLoading(false);
            })
            .catch(() => { setLoading(false); navigate('/'); });
    }, [id, user, navigate]);

    const myAttendance = event?.attendances?.find((a) => a.userId === user?.id);
    const isConfirmed = !!myAttendance?.confirmedAt;

    const handleRegister = async () => {
        if (!user) return;
        setConfirming(true);
        try {
            const res = await fetch(`/api/events/${id}/attend`, { method: 'POST' });
            if (res.ok) setAttending(true);
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return <div className="animate-pulse p-4 space-y-4"><div className="h-56 bg-base-200 rounded-3xl" /><div className="h-6 bg-base-200 rounded w-3/4" /><div className="h-20 bg-base-200 rounded" /></div>;
    if (!event) return null;

    return (
        <div className="flex flex-col">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3 flex items-center gap-2">
                <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>←</button>
                <h1 className="flex-1 text-sm font-bold truncate">{event.title}</h1>
                <span className="badge badge-primary gap-1 text-xs">+{event.coinsReward} 🪙</span>
            </header>

            {event.imageUrl && (
                <figure className="w-full aspect-[16/7] overflow-hidden bg-base-200">
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                </figure>
            )}

            <div className="px-4 py-4 space-y-4">
                <section className="space-y-2">
                    <h2 className="text-xl font-bold">{event.title}</h2>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="badge badge-outline">🕐 {event.dateLabel}</span>
                        <span className="badge badge-outline">📍 {event.location}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-base-content/80 pt-1">{event.description}</p>
                </section>

                {event.latitude && event.longitude && (
                    <section className="space-y-2">
                        <h3 className="text-sm font-bold flex items-center gap-1">📍 Место на карте</h3>
                        <div className="h-48 rounded-2xl overflow-hidden border border-base-300 shadow-inner">
                            <Suspense fallback={<div className="h-48 bg-base-200 animate-pulse rounded-xl" />}>
                                <MapComponent
                                    events={[event]}
                                    center={[event.latitude, event.longitude]}
                                    zoom={15}
                                />
                            </Suspense>
                        </div>
                    </section>
                )}

                {attending && user && (
                    <section className="card bg-primary/5 border border-primary/20 shadow-sm">
                        <div className="card-body p-4 items-center text-center">
                            <h3 className="card-title text-base">{isConfirmed ? '✅ Участие подтверждено!' : 'Ваш билет'}</h3>
                            {!isConfirmed ? (
                                <div className="p-3 bg-white rounded-xl shadow-md"><QRCode value={id || ''} size={140} /></div>
                            ) : (
                                <p className="text-sm font-semibold text-success">+{event.coinsReward} монет начислено!</p>
                            )}
                        </div>
                    </section>
                )}

                {!attending && (
                    <button className="btn btn-primary w-full" onClick={handleRegister} disabled={confirming || !user}>
                        {confirming ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                )}
            </div>
        </div>
    );
}
