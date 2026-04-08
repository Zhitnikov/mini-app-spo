import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '@/components/EventCard';
import type { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [reworkEvents, setReworkEvents] = useState<Event[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    fetch(`/api/events?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/events/my/drafts?status=NEEDS_REVISION')
      .then((r) => r.json())
      .then((data) => setReworkEvents(Array.isArray(data) ? data : []))
      .catch(() => null);
  }, [user]);

  const eventsWithCoords = events.filter((e) => e.latitude && e.longitude);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 pt-4 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Мероприятия</h1>
            <p className="text-xs text-base-content/60">Анонсы и запись</p>
          </div>
          <Link to="/propose-event" className="btn btn-primary btn-sm gap-1">
            <span>+</span> Предложить
          </Link>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">🔍</span>
          <input
            type="text"
            placeholder="Поиск мероприятий..."
            className="input input-sm input-bordered w-full pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        <Link to="/map" className="card bg-base-100 shadow-sm border border-primary/20 hover:bg-primary/5 transition-colors group">
          <div className="card-body p-4 flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📍</div>
              <div>
                <h2 className="text-sm font-bold">Карта мероприятий</h2>
                <p className="text-[10px] text-base-content/60">Смотреть все точки на карте</p>
              </div>
            </div>
            <span className="text-primary">→</span>
          </div>
        </Link>

        {reworkEvents.length > 0 && (
          <Link to="/propose-event" className="alert alert-warning">
            <span>Есть заявки мероприятий на доработку: {reworkEvents.length}. Нажмите, чтобы исправить и отправить повторно.</span>
          </Link>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card bg-base-100 shadow-sm animate-pulse h-64" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-base-content/60">
              {search ? 'Ничего не найдено' : 'Мероприятий пока нет'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`} className="block h-full">
                <EventCard event={event} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
