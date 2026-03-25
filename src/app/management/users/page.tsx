import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, UserRole } from '@/types';
import type { UserProfile } from '@/types';

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export default function ManagementUsersPage() {
    const { isComsostav, loading } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [search, setSearch] = useState('');
    const [fetching, setFetching] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [coinAmount, setCoinAmount] = useState('');
    const [coinReason, setCoinReason] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('CANDIDATE');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!loading && !isComsostav) navigate('/');
    }, [loading, isComsostav]);

    useEffect(() => {
        if (!isComsostav) return;
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        fetch(`/api/users?${params}`)
            .then((r) => r.json())
            .then((data) => { setUsers(Array.isArray(data) ? data : []); setFetching(false); })
            .catch(() => setFetching(false));
    }, [isComsostav, search]);

    const openModal = (u: UserProfile) => {
        setSelectedUser(u);
        setNewRole(u.role);
        setCoinAmount('');
        setCoinReason('');
    };

    const giveCoins = async () => {
        if (!selectedUser || !coinAmount) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/users/${selectedUser.id}/coins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseInt(coinAmount), reason: coinReason }),
            });
            if (res.ok) {
                const updated = await res.json();
                setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, coins: updated.coins } : u));
                setSelectedUser((prev) => prev ? { ...prev, coins: updated.coins } : null);
                setCoinAmount('');
            }
        } finally {
            setProcessing(false);
        }
    };

    const updateRole = async () => {
        if (!selectedUser) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, role: newRole } : u));
                setSelectedUser((prev) => prev ? { ...prev, role: newRole } : null);
            }
        } finally {
            setProcessing(false);
        }
    };

    const deleteUser = async (u: UserProfile) => {
        if (!confirm(`Удалить пользователя ${u.fullName}?`)) return;
        await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        setSelectedUser(null);
    };

    return (
        <div className="flex flex-col">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>←</button>
                    <h1 className="text-base font-bold">👥 Участники</h1>
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">🔍</span>
                    <input
                        type="text"
                        placeholder="Поиск..."
                        className="input input-sm input-bordered w-full pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <main className="px-4 py-4 space-y-2">
                {fetching ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => <div key={i} className="card bg-base-100 animate-pulse h-16" />)}
                    </div>
                ) : users.map((u) => (
                    <button
                        key={u.id}
                        className="card bg-base-100 shadow-sm w-full text-left hover:shadow-md transition-all"
                        onClick={() => openModal(u)}
                    >
                        <div className="card-body p-3 flex-row items-center gap-3">
                            <div className="avatar flex-none">
                                <div className="w-9 h-9 rounded-full bg-base-200">
                                    <img src={u.avatarUrl || `https://placehold.co/36/6366f1/white?text=${u.fullName[0]}`} alt={u.fullName} />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{u.fullName}</p>
                                <span className="badge badge-xs badge-outline text-[10px]">{ROLE_LABELS[u.role]}</span>
                            </div>
                            <div className="text-right flex-none text-sm">
                                <p className="font-bold text-warning">{u.coins} 🪙</p>
                                <p className="text-[10px] text-base-content/50">VK {u.vkId}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </main>

            {selectedUser && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-sm">
                        <h3 className="font-bold text-lg mb-1">{selectedUser.fullName}</h3>
                        <p className="text-xs text-base-content/60 mb-4">VK ID: {selectedUser.vkId} · Монет: {selectedUser.coins}</p>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm font-semibold">Начислить монеты</p>
                            <div className="flex gap-2">
                                <input
                                    type="number" min="1"
                                    placeholder="Количество"
                                    className="input input-sm input-bordered flex-1"
                                    value={coinAmount}
                                    onChange={(e) => setCoinAmount(e.target.value)}
                                />
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={giveCoins}
                                    disabled={!coinAmount || processing}
                                >
                                    +🪙
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Причина (опционально)"
                                className="input input-sm input-bordered w-full"
                                value={coinReason}
                                onChange={(e) => setCoinReason(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm font-semibold">Изменить роль</p>
                            <div className="flex gap-2">
                                <select
                                    className="select select-sm select-bordered flex-1"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                                >
                                    {ALL_ROLES.map((r) => (
                                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={updateRole}
                                    disabled={newRole === selectedUser.role || processing}
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>

                        <div className="modal-action flex gap-2">
                            <button
                                className="btn btn-error btn-sm btn-outline"
                                onClick={() => deleteUser(selectedUser)}
                            >
                                🗑️ Удалить
                            </button>
                            <button className="btn btn-sm flex-1" onClick={() => setSelectedUser(null)}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setSelectedUser(null)} />
                </dialog>
            )}
        </div>
    );
}
