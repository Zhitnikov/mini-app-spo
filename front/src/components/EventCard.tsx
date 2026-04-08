import type { Event } from '@/types';

export default function EventCard({ event }: { event: Event }) {
    return (
        <article className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group h-[400px]">
            <figure className="relative h-44 flex-none overflow-hidden bg-base-100 border-b border-base-200">
                {event.imageUrl ? (
                    <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📅</div>
                )}
                <div className="absolute top-3 right-3">
                    <span className="badge badge-primary font-medium text-[11px] shadow-sm">
                        +{event.coinsReward} 🪙
                    </span>
                </div>
            </figure>

            <div className="card-body p-4 flex flex-col justify-between">
                <div>
                    <h2 className="text-base font-bold text-base-content leading-tight line-clamp-2 h-10 mb-1">
                        {event.title}
                    </h2>

                    <p className="text-xs font-semibold text-primary/80 mb-2 truncate">
                        {event.subtitle || 'Мероприятие'}
                    </p>

                    <p className="text-xs text-base-content/60 line-clamp-3 leading-snug h-[50px]">
                        {event.shortDescription || 'Описание отсутствует'}
                    </p>

                    <div className="flex flex-col gap-1.5 mt-4">
                        <div className="flex items-center gap-2 text-base-content/40">
                            <span className="text-sm">🕐</span>
                            <span className="text-[11px] font-medium">{event.dateLabel || 'Дата не указана'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-base-content/40">
                            <span className="text-sm">📍</span>
                            <span className="text-[11px] font-medium truncate">{event.location || 'Место не указано'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs opacity-50">👥</span>
                        <span className="text-[11px] text-base-content/40 font-semibold">
                            {event._count?.attendances ?? 0} чел.
                        </span>
                    </div>
                    <div className="text-[11px] font-bold text-primary group-hover:underline transition-all cursor-pointer">
                        Подробнее →
                    </div>
                </div>
            </div>
        </article>
    );
}
