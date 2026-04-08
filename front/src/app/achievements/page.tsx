import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserAchievement } from '@/types';

export default function AchievementsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetch(`/api/users/${user.id}`)
            .then((r) => r.json())
            .then((data) => {
                setAchievements(Array.isArray(data?.achievements) ? data.achievements : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [user]);

    return (
        <div className="flex flex-col p-4 gap-4">
            <header className="flex items-center gap-2">
                <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>←</button>
                <h1 className="text-base font-bold">Мои достижения</h1>
            </header>
            {loading ? <div className="animate-pulse h-24 bg-base-200 rounded-2xl" /> : achievements.map((ua) => (
                <div key={ua.id} className="card bg-base-100 border border-base-300">
                    <div className="card-body p-4 flex-row items-center gap-3">
                        <div className="text-2xl">{ua.achievement.icon}</div>
                        <div>
                            <p className="font-semibold">{ua.achievement.name}</p>
                            <p className="text-xs text-base-content/60">{ua.achievement.description}</p>
                        </div>
                    </div>
                </div>
            ))}
            {!loading && achievements.length === 0 && <div className="text-sm text-base-content/60">Пока достижений нет.</div>}
        </div>
    );
}
