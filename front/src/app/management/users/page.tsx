import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, type UserRole } from '@/types';
import type { Achievement, ShopItem, UserProfile } from '@/types';

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

const fetchOpts: RequestInit = { credentials: 'include' };

type EditForm = {
    fullName: string;
    role: UserRole;
    coins: number;
    avatarUrl: string;
    backgroundId: string;
    orbitAchievementIds: string[];
};

const initialEditForm = (): EditForm => ({
    fullName: '',
    role: 'CANDIDATE',
    coins: 0,
    avatarUrl: '',
    backgroundId: '',
    orbitAchievementIds: [],
});

export default function ManagementUsersPage() {
    const { isComsostav, loading } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [search, setSearch] = useState('');
    const [fetching, setFetching] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedDetail, setExpandedDetail] = useState<UserProfile | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [editForm, setEditForm] = useState<EditForm>(() => initialEditForm());
    const [coinAmount, setCoinAmount] = useState('');
    const [coinReason, setCoinReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        vkId: '',
        fullName: '',
        role: 'CANDIDATE' as UserRole,
        coins: 0,
    });

    const [backgrounds, setBackgrounds] = useState<ShopItem[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    useEffect(() => {
        if (!loading && !isComsostav) navigate('/');
    }, [loading, isComsostav, navigate]);

    const loadUsers = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        fetch(`/api/users?${params}`, fetchOpts)
            .then((r) => r.json())
            .then((data) => {
                setUsers(Array.isArray(data) ? data : []);
                setFetching(false);
            })
            .catch(() => setFetching(false));
    }, [search]);

    useEffect(() => {
        if (!isComsostav) return;
        setFetching(true);
        loadUsers();
    }, [isComsostav, loadUsers]);

    useEffect(() => {
        if (!isComsostav) return;
        fetch('/api/shop', fetchOpts)
            .then((r) => r.json())
            .then((data: ShopItem[]) => {
                setBackgrounds(Array.isArray(data) ? data.filter((i) => i.type === 'BACKGROUND') : []);
            })
            .catch(() => {});
        fetch('/api/achievements', fetchOpts)
            .then((r) => r.json())
            .then((data) => {
                setAchievements(Array.isArray(data) ? data : []);
            })
            .catch(() => {});
    }, [isComsostav]);

    useEffect(() => {
        if (!expandedId) {
            setExpandedDetail(null);
            return;
        }
        let cancelled = false;
        setLoadingDetail(true);
        fetch(`/api/users/${expandedId}`, fetchOpts)
            .then((r) => r.json())
            .then((data: UserProfile) => {
                if (cancelled || !data?.id) return;
                setExpandedDetail(data);
                setEditForm({
                    fullName: data.fullName,
                    role: data.role,
                    coins: data.coins,
                    avatarUrl: data.avatarUrl ?? '',
                    backgroundId: data.backgroundId ?? '',
                    orbitAchievementIds: Array.isArray(data.orbitAchievementIds)
                        ? data.orbitAchievementIds
                        : [],
                });
            })
            .finally(() => {
                if (!cancelled) setLoadingDetail(false);
            });
        return () => {
            cancelled = true;
        };
    }, [expandedId]);

    const toggleOrbit = (achievementId: string) => {
        setEditForm((f) => {
            const set = new Set(f.orbitAchievementIds);
            if (set.has(achievementId)) set.delete(achievementId);
            else set.add(achievementId);
            return { ...f, orbitAchievementIds: [...set] };
        });
    };

    const saveUser = async () => {
        if (!expandedDetail) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/users/${expandedDetail.id}`, {
                ...fetchOpts,
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: editForm.fullName,
                    role: editForm.role,
                    coins: editForm.coins,
                    avatarUrl: editForm.avatarUrl.trim() || null,
                    backgroundId: editForm.backgroundId || null,
                    orbitAchievementIds: editForm.orbitAchievementIds,
                }),
            });
            if (res.ok) {
                const updated = (await res.json()) as UserProfile;
                setExpandedDetail(updated);
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === updated.id
                            ? {
                                  ...u,
                                  fullName: updated.fullName,
                                  role: updated.role,
                                  coins: updated.coins,
                                  avatarUrl: updated.avatarUrl,
                              }
                            : u,
                    ),
                );
            }
        } finally {
            setProcessing(false);
        }
    };

    const giveCoins = async () => {
        if (!expandedDetail || !coinAmount) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/users/${expandedDetail.id}/coins`, {
                ...fetchOpts,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseInt(coinAmount, 10),
                    reason: coinReason,
                }),
            });
            if (res.ok) {
                const updated = (await res.json()) as UserProfile;
                setExpandedDetail((prev) => (prev ? { ...prev, coins: updated.coins } : null));
                setEditForm((f) => ({ ...f, coins: updated.coins }));
                setUsers((prev) =>
                    prev.map((u) => (u.id === updated.id ? { ...u, coins: updated.coins } : u)),
                );
                setCoinAmount('');
                setCoinReason('');
            }
        } finally {
            setProcessing(false);
        }
    };

    const deleteUser = async (u: UserProfile) => {
        if (!confirm(`Удалить пользователя ${u.fullName}?`)) return;
        await fetch(`/api/users/${u.id}`, { method: 'DELETE', ...fetchOpts });
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        if (expandedId === u.id) setExpandedId(null);
    };

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const vk = parseInt(createForm.vkId.trim(), 10);
        if (!Number.isFinite(vk) || vk < 1) return;
        setProcessing(true);
        try {
            const res = await fetch('/api/users/create', {
                ...fetchOpts,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vkId: vk,
                    fullName: createForm.fullName.trim(),
                    role: createForm.role,
                    coins: createForm.coins,
                }),
            });
            if (res.ok) {
                const created = (await res.json()) as UserProfile;
                setUsers((prev) => [created, ...prev]);
                setCreateOpen(false);
                setCreateForm({
                    vkId: '',
                    fullName: '',
                    role: 'CANDIDATE',
                    coins: 0,
                });
            }
        } finally {
            setProcessing(false);
        }
    };

    const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData, ...fetchOpts });
        const data = await res.json();
        if (data.url) setEditForm((f) => ({ ...f, avatarUrl: data.url }));
    };

    return (
        <div className="flex flex-col pb-20">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>
                        ←
                    </button>
                    <h1 className="text-base font-bold flex-1">👥 Участники</h1>
                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => setCreateOpen(true)}
                    >
                        + Новый
                    </button>
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">🔍</span>
                    <input
                        type="text"
                        placeholder="Поиск..."
                        className="mgmt-input pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <main className="px-4 py-4 space-y-2">
                {fetching ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card bg-base-100 animate-pulse h-16" />
                        ))}
                    </div>
                ) : (
                    users.map((u) => (
                        <div key={u.id} className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
                            <div className="flex items-center gap-3 p-3">
                                <div className="avatar flex-none">
                                    <div className="w-10 h-10 rounded-full bg-base-200 ring-2 ring-base-300/80 overflow-hidden">
                                        <img
                                            src={
                                                u.avatarUrl ||
                                                `https://placehold.co/40/6366f1/white?text=${encodeURIComponent(u.fullName[0] ?? '?')}`
                                            }
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{u.fullName}</p>
                                    <span className="badge badge-xs badge-outline text-[10px]">
                                        {ROLE_LABELS[u.role]}
                                    </span>
                                </div>
                                <div className="text-right flex-none text-sm">
                                    <p className="font-bold text-warning">{u.coins} 🪙</p>
                                    <p className="text-[10px] text-base-content/50">VK {u.vkId}</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm btn-square shrink-0"
                                    aria-expanded={expandedId === u.id}
                                    onClick={() => setExpandedId((id) => (id === u.id ? null : u.id))}
                                >
                                    <ChevronDown
                                        className={clsx(
                                            'w-5 h-5 transition-transform duration-200',
                                            expandedId === u.id && 'rotate-180',
                                        )}
                                    />
                                </button>
                            </div>

                            {expandedId === u.id && (
                                <div className="border-t border-base-300 bg-base-200/40 px-3 py-4 space-y-4">
                                    {loadingDetail || !expandedDetail ? (
                                        <div className="flex justify-center py-6">
                                            <span className="loading loading-spinner loading-md text-primary" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="mgmt-field sm:col-span-2">
                                                    <span className="mgmt-label">VK ID</span>
                                                    <input
                                                        type="text"
                                                        className="mgmt-input opacity-70 cursor-not-allowed"
                                                        value={expandedDetail.vkId}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="mgmt-field sm:col-span-2">
                                                    <span className="mgmt-label">ФИО</span>
                                                    <input
                                                        type="text"
                                                        className="mgmt-input"
                                                        value={editForm.fullName}
                                                        onChange={(e) =>
                                                            setEditForm((f) => ({ ...f, fullName: e.target.value }))
                                                        }
                                                    />
                                                </div>
                                                <div className="mgmt-field">
                                                    <span className="mgmt-label">Роль</span>
                                                    <select
                                                        className="mgmt-input"
                                                        value={editForm.role}
                                                        onChange={(e) =>
                                                            setEditForm((f) => ({
                                                                ...f,
                                                                role: e.target.value as UserRole,
                                                            }))
                                                        }
                                                    >
                                                        {ALL_ROLES.map((r) => (
                                                            <option key={r} value={r}>
                                                                {ROLE_LABELS[r]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="mgmt-field">
                                                    <span className="mgmt-label">Монеты (баланс)</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="mgmt-input"
                                                        value={editForm.coins}
                                                        onChange={(e) =>
                                                            setEditForm((f) => ({
                                                                ...f,
                                                                coins: Math.max(0, Number(e.target.value) || 0),
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                <div className="mgmt-field sm:col-span-2">
                                                    <span className="mgmt-label">Аватар (URL или загрузка)</span>
                                                    <div className="flex gap-2 flex-wrap">
                                                        <input
                                                            type="text"
                                                            className="mgmt-input flex-1 min-w-[12rem]"
                                                            placeholder="https://..."
                                                            value={editForm.avatarUrl}
                                                            onChange={(e) =>
                                                                setEditForm((f) => ({
                                                                    ...f,
                                                                    avatarUrl: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                        <label className="btn btn-sm btn-outline shrink-0">
                                                            Файл
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => uploadAvatar(e)}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="mgmt-field sm:col-span-2">
                                                    <span className="mgmt-label">Фон профиля</span>
                                                    <select
                                                        className="mgmt-input"
                                                        value={editForm.backgroundId}
                                                        onChange={(e) =>
                                                            setEditForm((f) => ({
                                                                ...f,
                                                                backgroundId: e.target.value,
                                                            }))
                                                        }
                                                    >
                                                        <option value="">Без фона</option>
                                                        {backgrounds.map((b) => (
                                                            <option key={b.id} value={b.id}>
                                                                {b.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="mgmt-field sm:col-span-2">
                                                    <span className="mgmt-label">Орбита достижений</span>
                                                    <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-base-100 border border-base-300 max-h-40 overflow-y-auto">
                                                        {achievements.length === 0 ? (
                                                            <span className="text-xs text-base-content/50">
                                                                Нет ачивок в системе
                                                            </span>
                                                        ) : (
                                                            achievements.map((a) => (
                                                                <label
                                                                    key={a.id}
                                                                    className="flex items-center gap-2 cursor-pointer text-xs bg-base-200 px-2 py-1 rounded-lg"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="checkbox checkbox-xs checkbox-primary"
                                                                        checked={editForm.orbitAchievementIds.includes(
                                                                            a.id,
                                                                        )}
                                                                        onChange={() => toggleOrbit(a.id)}
                                                                    />
                                                                    <span className="truncate max-w-[10rem]">
                                                                        {a.icon}{' '}
                                                                        {a.name}
                                                                    </span>
                                                                </label>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-primary/20 bg-base-100 p-3 space-y-2">
                                                <span className="mgmt-label">Начислить монеты</span>
                                                <div className="flex gap-2 flex-wrap">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        placeholder="Сумма"
                                                        className="mgmt-input w-28"
                                                        value={coinAmount}
                                                        onChange={(e) => setCoinAmount(e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Причина"
                                                        className="mgmt-input flex-1 min-w-[8rem]"
                                                        value={coinReason}
                                                        onChange={(e) => setCoinReason(e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        disabled={!coinAmount || processing}
                                                        onClick={giveCoins}
                                                    >
                                                        +🪙
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-primary flex-1 min-w-[8rem]"
                                                    disabled={processing}
                                                    onClick={saveUser}
                                                >
                                                    Сохранить профиль
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-error btn-outline"
                                                    onClick={() => deleteUser(u)}
                                                >
                                                    🗑️ Удалить
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>

            {createOpen && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg mb-3">Новый участник</h3>
                        <p className="text-xs text-base-content/60 mb-4">
                            Укажите реальный VK ID. Пользователь сможет войти через мини-приложение с этим аккаунтом.
                            Аватар, фон и орбиту достижений участник настроит сам в профиле.
                        </p>
                        <form className="space-y-3" onSubmit={createUser}>
                            <div className="mgmt-field">
                                <span className="mgmt-label">VK ID *</span>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    className="mgmt-input"
                                    placeholder="Например 123456789"
                                    value={createForm.vkId}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, vkId: e.target.value }))}
                                />
                            </div>
                            <div className="mgmt-field">
                                <span className="mgmt-label">ФИО *</span>
                                <input
                                    type="text"
                                    required
                                    className="mgmt-input"
                                    value={createForm.fullName}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                                />
                            </div>
                            <div className="mgmt-field">
                                <span className="mgmt-label">Роль</span>
                                <select
                                    className="mgmt-input"
                                    value={createForm.role}
                                    onChange={(e) =>
                                        setCreateForm((f) => ({
                                            ...f,
                                            role: e.target.value as UserRole,
                                        }))
                                    }
                                >
                                    {ALL_ROLES.map((r) => (
                                        <option key={r} value={r}>
                                            {ROLE_LABELS[r]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mgmt-field">
                                <span className="mgmt-label">Стартовые монеты</span>
                                <input
                                    type="number"
                                    min={0}
                                    className="mgmt-input"
                                    value={createForm.coins}
                                    onChange={(e) =>
                                        setCreateForm((f) => ({
                                            ...f,
                                            coins: Math.max(0, Number(e.target.value) || 0),
                                        }))
                                    }
                                />
                            </div>
                            <div className="modal-action flex flex-wrap gap-2 mt-4">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setCreateOpen(false)}
                                >
                                    Отмена
                                </button>
                                <button type="submit" className="btn btn-primary flex-1" disabled={processing}>
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop" onClick={() => setCreateOpen(false)} />
                </dialog>
            )}
        </div>
    );
}
