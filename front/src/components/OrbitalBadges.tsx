import { useEffect, useRef } from 'react';
import type { UserBadge } from '@/types';

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
    const containerRef = useRef<HTMLDivElement>(null);
    const sourceItems: OrbitalItem[] = [
        ...badges.map((b) => ({
            id: b.id,
            name: b.item?.name || 'Значок',
            icon: b.item?.icon || '⭐',
            hint: b.item?.price != null ? `${b.item.price} 🪙` : undefined,
        })),
        ...items,
    ];

    if (sourceItems.length === 0) return null;

    const radius = size / 2 + 28;
    const centerX = 0;
    const centerY = 0;

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{ width: size, height: size }}
        >
            {sourceItems.slice(0, 6).map((item, i) => {
                const angle = (360 / Math.min(sourceItems.length, 6)) * i;
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;

                return (
                    <div
                        key={item.id}
                        className="absolute pointer-events-auto cursor-pointer group"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            animation: `orbit-${i % 3} ${6 + i * 0.5}s linear infinite`,
                        }}
                        title={item.name}
                    >
                        <div className="relative">
                            <span className="text-2xl drop-shadow-md hover:scale-125 transition-transform block">
                                {item.icon?.startsWith('/') || item.icon?.startsWith('http') ? (
                                    <img src={item.icon} className="w-8 h-8 object-contain" alt="" />
                                ) : (
                                    item.icon
                                )}
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-base-300 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
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
                );
            })}
        </div>
    );
}
