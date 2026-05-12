import { Fragment, useMemo, useRef } from 'react';
import type { UserBadge } from '@/types';
import { useOrbitalEllipseAnimation } from '@/hooks/useOrbitalEllipseAnimation';

export const ORBIT_AVATAR_Z = 22;

export interface OrbitalItem {
    id: string;
    name: string;
    icon: string | null | undefined;
    hint?: string;
}

interface Props {
    badges?: UserBadge[];
    items?: OrbitalItem[];
    size?: number;
}

export default function OrbitalBadges({ badges = [], items = [], size = 160 }: Props) {
    const sourceItems: OrbitalItem[] = useMemo(
        () => [
            ...badges.map((b) => ({
                id: b.id,
                name: b.item?.name || 'Значок',
                icon: b.item?.icon || '⭐',
                hint: b.item?.price != null ? `${b.item.price} 🪙` : undefined,
            })),
            ...items,
        ],
        [badges, items],
    );

    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
    const count = Math.min(sourceItems.length, 6);
    const radiusX = Math.max(size * 0.56, 52);
    const radiusY = radiusX * 0.58;
    const itemKey = useMemo(
        () => sourceItems.slice(0, 6).map((s) => s.id).join('|'),
        [sourceItems],
    );

    useOrbitalEllipseAnimation(slotRefs, count, radiusX, radiusY, itemKey);

    if (sourceItems.length === 0) return null;

    return (
        <Fragment>
            {sourceItems.slice(0, 6).map((item, i) => (
                <div
                    key={item.id}
                    ref={(el) => {
                        slotRefs.current[i] = el;
                    }}
                    className="absolute left-1/2 top-1/2 pointer-events-auto cursor-pointer group will-change-transform"
                    style={{ transform: 'translate(-50%, -50%) scale(1)', zIndex: 10 + i }}
                    title={item.name}
                >
                    <div className="relative">
                        <span className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 shadow-[0_2px_10px_rgba(15,23,42,0.25)] flex items-center justify-center text-2xl drop-shadow-md hover:scale-110 transition-transform block">
                            {item.icon?.startsWith('/') || item.icon?.startsWith('http') ? (
                                <img src={item.icon} className="w-6 h-6 object-contain" alt="" />
                            ) : (
                                item.icon
                            )}
                        </span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-base-300 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                            {item.name}
                            {item.hint ? (
                                <>
                                    <br />
                                    <span className="text-warning">{item.hint}</span>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            ))}
        </Fragment>
    );
}
