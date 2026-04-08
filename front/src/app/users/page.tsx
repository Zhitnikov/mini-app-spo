import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '@/types';
import type { UserProfile } from '@/types';

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        fetch(`/api/users?${params}`)
            .then((r) => r.json())
            .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [search]);

    return (
        <div className="flex flex-col pb-20 md:pb-0">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-bold">👥 Участники</h1>
                    <span className="badge badge-ghost">{users.length} чел.</span>
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">🔍</span>
                    <input
                        type="text"
                        placeholder="Поиск по имени..."
                        className="input input-sm input-bordered w-full pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <main className="px-4 py-4 space-y-2">
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="card bg-base-100 animate-pulse h-16" />
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">👤</div>
                        <p className="text-base-content/60">Никого не найдено</p>
                    </div>
                ) : (
                    users.map((u, idx) => (
                        <Link
                            key={u.id}
                            to={`/users/${u.id}`}
                            className="card bg-base-100 shadow-sm hover:shadow-md transition-all block"
                        >
                            <div className="card-body p-3 flex-row items-center gap-3">
                                {/* Rank */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-none
                  ${idx === 0 ? 'bg-warning text-warning-content' :
                                        idx === 1 ? 'bg-base-300 text-base-content' :
                                            idx === 2 ? 'bg-orange-400/20 text-orange-600' :
                                                'bg-base-200 text-base-content/60'}`}
                                >
                                    {idx + 1}
                                </div>

                                <div className="avatar flex-none">
                                    <div className="w-10 h-10 rounded-full ring ring-base-300 ring-offset-1">
                                        <img
                                            src={u.avatarUrl || `https://placehold.co/40x40/6366f1/white?text=${u.fullName[0]}`}
                                            alt={u.fullName}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{u.fullName}</p>
                                    <span className="badge badge-xs badge-outline text-[10px]">
                                        {ROLE_LABELS[u.role]}
                                    </span>
                                </div>

                                <div className="text-right flex-none">
                                    <div className="font-bold text-warning">{u.coins} 🪙</div>
                                    <div className="text-xs text-base-content/50">
                                        {(u as any)._count?.attendances ?? 0} меропр.
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </main>
        </div>
    );
}
