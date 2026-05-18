import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown, faPlus, faTrash, faPen, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { isManagementLeaderRole } from '@/lib/leaderRoles';
import { ROLE_LABELS, type MaterialDocument, type UserRole, type UserProfile } from '@/types';

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export default function MaterialsPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const isAdmin = isManagementLeaderRole(user?.role);

    const [docs, setDocs] = useState<MaterialDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminOpen, setAdminOpen] = useState(false);
    const [editing, setEditing] = useState<MaterialDocument | null>(null);

    const [title, setTitle] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
    const [userQuery, setUserQuery] = useState('');
    const [userResults, setUserResults] = useState<UserProfile[]>([]);
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        const url = isAdmin ? '/api/resources/materials/admin' : '/api/resources/materials';
        fetch(url)
            .then(async (r) => {
                if (!r.ok) return [];
                const data = await r.json();
                return Array.isArray(data) ? data : [];
            })
            .then(setDocs)
            .finally(() => setLoading(false));
    }, [isAdmin]);

    useEffect(() => {
        if (!authLoading && user) load();
    }, [authLoading, user, load]);

    useEffect(() => {
        if (!userQuery.trim()) {
            setUserResults([]);
            return;
        }
        const t = setTimeout(() => {
            const params = new URLSearchParams({ q: userQuery.trim() });
            fetch(`/api/users?${params}`)
                .then(async (r) => (r.ok ? r.json() : []))
                .then((data) => setUserResults(Array.isArray(data) ? data : []));
        }, 250);
        return () => clearTimeout(t);
    }, [userQuery]);

    const resetForm = () => {
        setEditing(null);
        setTitle('');
        setFileUrl('');
        setFileName('');
        setSelectedRoles([]);
        setSelectedUsers([]);
        setUserQuery('');
        setAdminOpen(false);
    };

    const openEdit = (doc: MaterialDocument) => {
        setEditing(doc);
        setTitle(doc.title);
        setFileUrl(doc.fileUrl);
        setFileName(doc.fileName);
        setSelectedRoles(doc.roleAccess?.map((r) => r.role) ?? []);
        setSelectedUsers(
            (doc.userAccess?.map((u) => u.user).filter(Boolean) ?? []) as UserProfile[],
        );
        setAdminOpen(true);
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.url) {
                setFileUrl(data.url);
                setFileName(file.name);
                if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''));
            }
        } finally {
            setUploading(false);
        }
    };

    const toggleRole = (role: UserRole) => {
        setSelectedRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
        );
    };

    const addUser = (u: UserProfile) => {
        if (selectedUsers.some((x) => x.id === u.id)) return;
        setSelectedUsers((prev) => [...prev, u]);
        setUserQuery('');
        setUserResults([]);
    };

    const saveDoc = async () => {
        if (!title.trim() || !fileUrl) return;
        setSaving(true);
        try {
            const body = {
                title: title.trim(),
                fileUrl,
                fileName: fileName || title,
                allowedRoles: selectedRoles,
                allowedUserIds: selectedUsers.map((u) => u.id),
            };
            const res = await fetch(
                editing ? `/api/resources/materials/${editing.id}` : '/api/resources/materials',
                {
                    method: editing ? 'PATCH' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                },
            );
            if (res.ok) {
                resetForm();
                load();
            }
        } finally {
            setSaving(false);
        }
    };

    const deleteDoc = async (id: string) => {
        if (!confirm('Удалить документ?')) return;
        const res = await fetch(`/api/resources/materials/${id}`, { method: 'DELETE' });
        if (res.ok) load();
    };

    const openDocument = async (doc: MaterialDocument) => {
        const res = await fetch(`/api/resources/materials/${doc.id}/access`);
        if (!res.ok) {
            alert('Нет доступа к файлу');
            return;
        }
        const data = await res.json();
        const url = data.fileUrl?.startsWith('http') ? data.fileUrl : `${window.location.origin}${data.fileUrl}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-slate-50 pb-20 md:pb-6">
            <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-300 px-4 py-3">
                <div className="flex items-center gap-2">
                    <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => navigate('/resources')}>←</button>
                    <h1 className="text-base font-bold flex-1">Материалы</h1>
                    {isAdmin && (
                        <button type="button" className="btn btn-primary btn-sm gap-1" onClick={() => { resetForm(); setAdminOpen(true); }}>
                            <FontAwesomeIcon icon={faPlus} />
                            Добавить
                        </button>
                    )}
                </div>
            </header>

            <main className="p-4 space-y-2">
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-base-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : docs.length === 0 ? (
                    <p className="text-center text-sm text-base-content/60 py-12">Нет доступных документов</p>
                ) : (
                    docs.map((doc) => (
                        <div key={doc.id} className="card bg-white border border-slate-100 shadow-sm">
                            <div className="card-body p-4 flex-row items-center gap-3">
                                <button
                                    type="button"
                                    className="btn btn-circle btn-ghost btn-sm text-primary shrink-0"
                                    onClick={() => openDocument(doc)}
                                >
                                    <FontAwesomeIcon icon={faFileArrowDown} />
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 min-w-0 text-left"
                                    onClick={() => openDocument(doc)}
                                >
                                    <p className="font-semibold text-sm truncate">{doc.title}</p>
                                    <p className="text-[10px] text-base-content/50 truncate">{doc.fileName}</p>
                                </button>
                                {isAdmin && (
                                    <div className="flex gap-1 shrink-0">
                                        <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={() => openEdit(doc)}>
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>
                                        <button type="button" className="btn btn-ghost btn-xs btn-square text-error" onClick={() => deleteDoc(doc.id)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {adminOpen && isAdmin && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg mb-3">{editing ? 'Редактировать' : 'Новый документ'}</h3>
                        <div className="space-y-3">
                            <input
                                className="input input-bordered w-full input-sm"
                                placeholder="Название"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <input type="file" className="file-input file-input-bordered w-full file-input-sm" onChange={handleFile} />
                            {uploading && <span className="loading loading-spinner loading-xs" />}
                            {fileUrl && <p className="text-xs text-success truncate">{fileName || fileUrl}</p>}

                            <div>
                                <p className="text-xs font-bold text-slate-500 mb-2">Доступ по ролям (пусто = всем)</p>
                                <div className="flex flex-wrap gap-1">
                                    {ALL_ROLES.map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            className={`btn btn-xs ${selectedRoles.includes(r) ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => toggleRole(r)}
                                        >
                                            {ROLE_LABELS[r]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-500 mb-2">Доступ по участникам</p>
                                <div className="relative">
                                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-xs" />
                                    <input
                                        className="input input-bordered input-sm w-full pl-8"
                                        placeholder="Поиск по имени..."
                                        value={userQuery}
                                        onChange={(e) => setUserQuery(e.target.value)}
                                    />
                                </div>
                                {userResults.length > 0 && (
                                    <div className="mt-1 border border-base-300 rounded-lg max-h-32 overflow-auto">
                                        {userResults.map((u) => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-base-200"
                                                onClick={() => addUser(u)}
                                            >
                                                {u.fullName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selectedUsers.map((u) => (
                                        <span key={u.id} className="badge badge-ghost gap-1">
                                            {u.fullName}
                                            <button type="button" onClick={() => setSelectedUsers((p) => p.filter((x) => x.id !== u.id))}>×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button type="button" className="btn btn-primary btn-sm" disabled={saving || !fileUrl} onClick={saveDoc}>
                                {saving ? <span className="loading loading-spinner loading-xs" /> : 'Сохранить'}
                            </button>
                            <button type="button" className="btn btn-sm" onClick={resetForm}>Отмена</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={resetForm} />
                </dialog>
            )}
        </div>
    );
}

