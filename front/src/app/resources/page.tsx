import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faFolderOpen, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { canViewSquadTreasury } from '@/lib/leaderRoles';

export default function ResourcesPage() {
    const { user } = useAuth();
    const treasuryAllowed = canViewSquadTreasury(user?.role);

    return (
        <div className="flex flex-col min-h-full bg-slate-50 pb-20 md:pb-6">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-4">
                <h1 className="text-xl font-bold text-slate-800">Ресурсы</h1>
                <p className="text-xs text-base-content/60 mt-1">Материалы отряда и отчётность</p>
            </header>

            <main className="p-4 space-y-3">
                <Link
                    to={treasuryAllowed ? '/resources/treasury' : '#'}
                    className={`card bg-white shadow-sm border border-slate-100 transition-all block ${
                        treasuryAllowed
                            ? 'hover:border-primary/30 hover:shadow-md'
                            : 'opacity-50 pointer-events-none'
                    }`}
                    onClick={(e) => {
                        if (!treasuryAllowed) e.preventDefault();
                    }}
                >
                    <div className="card-body p-5 flex flex-row items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
                            <FontAwesomeIcon icon={faTable} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-slate-800">Отрядная касса</h2>
                            <p className="text-xs text-slate-500 mt-1 leading-snug">
                                {treasuryAllowed
                                    ? 'Сводная таблица взносов (обновление раз в час)'
                                    : 'Доступно бойцам и комсоставу'}
                            </p>
                        </div>
                        {treasuryAllowed && (
                            <FontAwesomeIcon icon={faChevronRight} className="text-slate-300 shrink-0" />
                        )}
                    </div>
                </Link>

                <Link
                    to="/resources/materials"
                    className="card bg-white shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all block"
                >
                    <div className="card-body p-5 flex flex-row items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                            <FontAwesomeIcon icon={faFolderOpen} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-slate-800">Материалы</h2>
                            <p className="text-xs text-slate-500 mt-1 leading-snug">
                                Документы с доступом по роли и участникам
                            </p>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} className="text-slate-300 shrink-0" />
                    </div>
                </Link>
            </main>
        </div>
    );
}
