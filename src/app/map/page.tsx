import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event } from '@/types';

const MapComponent = lazy(() => import('@/components/MapComponent'));

export default function MapPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapView, setMapView] = useState<{ center: [number, number]; zoom: number }>({
        center: [59.9311, 30.3609], // СПБ
        zoom: 11
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/events')
            .then((r) => r.json())
            .then((data) => {
                setEvents(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const eventsWithCoords = events.filter((e) => e.latitude && e.longitude);

    const focusEvent = (ev: Event) => {
        if (ev.latitude && ev.longitude) {
            setMapView({ center: [ev.latitude, ev.longitude], zoom: 15 });
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">
            <header className="flex-none bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-3 z-50 shadow-sm">
                <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>
                    <span className="text-xl">←</span>
                </button>
                <div>
                    <h1 className="text-sm font-black tracking-widest uppercase text-slate-800">КАРТА МЕРОПРИЯТИЙ</h1>
                    <p className="text-[10px] text-slate-400 font-bold">
                        {eventsWithCoords.length} АКТИВНЫХ ТОЧЕК
                    </p>
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden">
                <Suspense fallback={
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                }>
                    <MapComponent
                        events={eventsWithCoords}
                        center={mapView.center}
                        zoom={mapView.zoom}
                    />
                </Suspense>

                <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-2">
                        {eventsWithCoords.length > 0 ? (
                            eventsWithCoords.map(ev => (
                                <div
                                    key={ev.id}
                                    onClick={() => focusEvent(ev)}
                                    className="flex-none w-64 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl border border-white hover:border-primary/50 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                            📍
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{ev.title}</p>
                                            <p className="text-[9px] text-slate-500 font-medium truncate uppercase tracking-tighter italic">
                                                {ev.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-lg text-xs font-bold text-slate-400 border border-white mx-auto">
                                МЕРОПРИЯТИЯ С КООРДИНАТАМИ НЕ НАЙДЕНЫ
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
