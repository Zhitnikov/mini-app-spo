import { useEffect, useRef } from 'react';
import type { UserBadge } from '@/types';

interface Props {
    badges: UserBadge[];
    size?: number;
}

export default function OrbitalBadges({ badges, size = 160 }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    if (!badges || badges.length === 0) return null;

    const radius = size / 2 + 28;
    const centerX = 0;
    const centerY = 0;

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{ width: size, height: size }}
        >
            {badges.slice(0, 6).map((badge, i) => {
                const angle = (360 / Math.min(badges.length, 6)) * i;
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;

                return (
                    <div
                        key={badge.id}
                        className="absolute pointer-events-auto cursor-pointer group"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            animation: `orbit-${i % 3} ${6 + i * 0.5}s linear infinite`,
                        }}
                        title={`${badge.item.name} — ${badge.item.price} 🪙`}
                    >
                        <div className="relative">
                            <span className="text-2xl drop-shadow-md hover:scale-125 transition-transform block">
                                {badge.item.icon?.startsWith('/') || badge.item.icon?.startsWith('http') ? (
                                    <img src={badge.item.icon} className="w-8 h-8 object-contain" alt="" />
                                ) : (
                                    badge.item.icon
                                )}
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-base-300 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                {badge.item.name}
                                <br />
                                <span className="text-warning">{badge.item.price} 🪙</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
