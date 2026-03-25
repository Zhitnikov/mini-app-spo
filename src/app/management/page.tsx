import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CatOleg from '@/components/CatOleg';

export default function ManagementPage() {
    const { user, isComsostav, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !isComsostav) {
            navigate('/');
        }
    }, [authLoading, isComsostav, navigate]);

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Checking credentials</p>
            </div>
        );
    }

    if (!isComsostav) return null;

    const actions = [
        {
            href: '/management/events',
            icon: (
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <span className="text-xl font-black">M</span>
                </div>
            ),
            label: 'Мероприятия',
            desc: 'Модерация и список',
            color: 'bg-transparent'
        },
        {
            href: '/management/users',
            icon: (
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <span className="text-xl font-black">У</span>
                </div>
            ),
            label: 'Участники',
            desc: 'Всё по бойцам',
            color: 'bg-transparent'
        },
        {
            href: '/management/shop',
            icon: (
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                    <span className="text-xl font-black">Ш</span>
                </div>
            ),
            label: 'Магазин',
            desc: 'Склад и товары',
            color: 'bg-transparent'
        },
        {
            href: '/management/achievements',
            icon: (
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <span className="text-xl font-black">Н</span>
                </div>
            ),
            label: 'Награды',
            desc: 'Список ачивок',
            color: 'bg-transparent'
        },
    ];

    return (
        <div className="flex flex-col min-h-full bg-slate-50 pb-24 md:pb-8">
            <header className="px-6 pt-10 pb-12 bg-slate-900 overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-xl font-bold text-white tracking-tight">Управление</h1>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Инфосистема СПО</p>
                </div>
            </header>

            <main className="p-4 md:p-6 -mt-8 relative z-20 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    {actions.map((a) => (
                        <Link key={a.href} to={a.href} className="group flex flex-col bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/20 transition-all active:scale-[0.97]">
                            <div className="mb-4">
                                {a.icon}
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">{a.label}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">{a.desc}</p>
                        </Link>
                    ))}
                </div>

                <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5 group cursor-pointer hover:border-primary/30 transition-all">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center flex-none group-hover:scale-105 transition-transform overflow-hidden p-2">
                        <CatOleg equippedItemIds={[]} ownedItems={[]} size="sm" interactive={false} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Кот Олег</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 leading-tight">Системный администратор готов к работе</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Database</p>
                        <p className="text-xs font-black text-emerald-500 uppercase italic">Online</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Status</p>
                        <p className="text-xs font-black text-primary uppercase italic">Synced</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
