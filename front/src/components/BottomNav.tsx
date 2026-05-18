import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faUsers, faStore, faUser, faGear, faFolderOpen } from '@fortawesome/free-solid-svg-icons';

const navItems = [
    { href: '/', label: 'Мероприятия', icon: faCalendarDays },
    { href: '/users', label: 'Люди', icon: faUsers },
    { href: '/shop', label: 'Магазин', icon: faStore },
    { href: '/resources', label: 'Ресурсы', icon: faFolderOpen },
    { href: '/profile', label: 'Профиль', icon: faUser },
];

const comsostavItem = { href: '/management', label: 'Управление', icon: faGear };

export default function BottomNav() {
    const location = useLocation();
    const pathname = location.pathname;
    const { isComsostav } = useAuth();

    const items = isComsostav ? [...navItems, comsostavItem] : navItems;

    return (
        <nav className="relative z-50 w-full shrink-0 bg-base-100 border-t border-base-300 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex items-stretch h-16">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
                ${isActive
                                    ? 'text-primary border-t-2 border-primary -mt-px'
                                    : 'text-base-content/50 hover:text-base-content'
                                }`}
                        >
                            <span className="text-xl leading-none"><FontAwesomeIcon icon={item.icon} /></span>
                            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
