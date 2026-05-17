import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faUsers, faStore, faCat, faUser, faGear, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import SpoMiniLogo from '@/components/SpoMiniLogo';
import { useAuth } from '@/contexts/AuthContext';

type NavLink = {
    href: string;
    icon: typeof faCalendarDays;
    label: string;
    divider?: boolean;
};

const baseLinks: NavLink[] = [
    { href: "/", icon: faCalendarDays, label: "Мероприятия" },
    { href: "/users", icon: faUsers, label: "Участники" },
    { href: "/shop", icon: faStore, label: "Магазин" },
    { href: "/cat", icon: faCat, label: "Кот Олег" },
    { href: "/profile", icon: faUser, label: "Профиль" },
];

const managementLink: NavLink = { href: "/management", icon: faGear, label: "Управление", divider: true };

export default function DesktopSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const pathname = location.pathname;
    const { isComsostav } = useAuth();
    const links = isComsostav ? [...baseLinks, managementLink] : baseLinks;

    return (
        <aside className={`hidden md:flex flex-col transition-all duration-300 relative border-r border-slate-100 bg-slate-50/50 p-4 space-y-8 ${isCollapsed ? 'w-20' : 'w-64'}`}>

            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-6 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-slate-50 transition-colors z-50 transition-transform duration-300"
                style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
                <FontAwesomeIcon icon={faChevronLeft} />
            </button>

            <Link to="/" className="flex items-center gap-3 group overflow-hidden">
                <div className="flex-none w-11 h-11 bg-slate-800 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-slate-200 text-white relative overflow-hidden group-hover:bg-slate-900 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                    <span className="relative flex items-center justify-center [&_svg]:drop-shadow-sm">
                        <SpoMiniLogo className="w-[22px] h-[22px] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
                    </span>
                </div>
                {!isCollapsed && (
                    <div className="transition-opacity duration-200 whitespace-nowrap">
                        <h1 className="font-black text-sm tracking-[0.15em] text-slate-800 uppercase leading-none">СПО МИНИ</h1>
                        <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">Версия 1.2</p>
                    </div>
                )}
            </Link>

            <nav className="flex-1 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <div key={link.href}>
                            {link.divider && !isCollapsed && <div className="divider opacity-50 my-2"></div>}
                            <Link
                                to={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold whitespace-nowrap
                  ${isActive ? 'bg-white shadow-sm text-primary' : 'text-slate-600 hover:bg-slate-100/50 hover:text-primary'}
                `}
                                title={isCollapsed ? link.label : ''}
                            >
                                <span className="text-lg flex-none"><FontAwesomeIcon icon={link.icon} /></span>
                                {!isCollapsed && <span className="transition-opacity duration-200">{link.label}</span>}
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {!isCollapsed && (
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-[10px] text-slate-400">
                    <p className="font-semibold text-slate-500 mb-1 tracking-wider uppercase">Инфосистема</p>
                    <p>Версия 1.2.0-beta</p>
                </div>
            )}
        </aside>
    );
}
