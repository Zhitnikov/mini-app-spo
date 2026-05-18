import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canViewSquadTreasury, isManagementLeaderRole } from '@/lib/leaderRoles';
import type { SquadTreasuryData } from '@/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotate } from '@fortawesome/free-solid-svg-icons';

export default function TreasuryPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<SquadTreasuryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allowed = canViewSquadTreasury(user?.role);
    const isAdmin = isManagementLeaderRole(user?.role);

    useEffect(() => {
        if (!authLoading && !allowed) navigate('/resources');
    }, [authLoading, allowed, navigate]);

    const load = () => {
        setLoading(true);
        setError(null);
        fetch('/api/resources/treasury')
            .then(async (r) => {
                const json = await r.json();
                if (!r.ok) throw new Error(json.message || 'Не удалось загрузить');
                return json as SquadTreasuryData;
            })
            .then((d) => setData(d))
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (allowed) load();
    }, [allowed]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/resources/treasury/sync', { method: 'POST' });
            if (res.ok) load();
        } finally {
            setSyncing(false);
        }
    };

    if (authLoading || !allowed) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    const headers = data?.headers ?? [];
    const rows = data?.rows ?? [];

    return (
        <div className="flex flex-col min-h-full bg-slate-50 pb-20 md:pb-6">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                    <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => navigate('/resources')}>←</button>
                    <h1 className="text-base font-bold flex-1">Отрядная касса</h1>
                    {isAdmin && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm gap-1"
                            onClick={handleSync}
                            disabled={syncing}
                        >
                            <FontAwesomeIcon icon={faRotate} className={syncing ? 'animate-spin' : ''} />
                            Обновить
                        </button>
                    )}
                </div>
                {data?.syncedAt && (
                    <p className="text-[10px] text-base-content/50 pl-10">
                        Данные на {new Date(data.syncedAt).toLocaleString('ru-RU')} · автообновление раз в час
                    </p>
                )}
            </header>

            <main className="p-3">
                {loading ? (
                    <div className="animate-pulse h-48 bg-base-200 rounded-xl" />
                ) : error ? (
                    <div className="alert alert-error text-sm">{error}</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="table table-xs md:table-sm w-full min-w-[720px]">
                            <thead className="bg-slate-100 sticky top-0 z-10">
                                <tr>
                                    {headers.slice(0, 15).map((h, i) => (
                                        <th key={i} className="whitespace-nowrap font-bold text-slate-700 px-2 py-2">
                                            {h || String.fromCharCode(65 + i)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, ri) => (
                                    <tr key={ri} className={row[0]?.toLowerCase() === 'итого' ? 'bg-warning/10 font-bold' : ''}>
                                        {Array.from({ length: 15 }, (_, ci) => (
                                            <td key={ci} className="whitespace-nowrap px-2 py-1.5 max-w-[200px] truncate" title={row[ci] ?? ''}>
                                                {row[ci] ?? ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

