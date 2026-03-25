import { useState, useEffect } from 'react';
import type { UserShopItem } from '@/types';

type CatMood = 'idle' | 'happy' | 'jump';

interface CatOlegProps {
    equippedItemIds: string[];
    ownedItems: UserShopItem[];
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onJump?: () => void;
}

const CAT_FRAMES = {
    idle: '🐱',
    happy: '😸',
    jump: '🙀',
};

const getItemStyle = (id: string, name: string = '', description: string = '', size: 'sm' | 'md' | 'lg') => {
    const s = size === 'sm' ? 0.6 : size === 'md' ? 1 : 1.5;
    const searchStr = (id + name + description).toLowerCase();

    if (searchStr.includes('hat') || searchStr.includes('crown') || searchStr.includes('cap') ||
        searchStr.includes('шапк') || searchStr.includes('шляп') || searchStr.includes('корон') ||
        searchStr.includes('ушки') || searchStr.includes('кепк')) {
        return {
            position: 'absolute' as const,
            top: `${-15 * s}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${28 * s}px`,
            zIndex: 10,
        };
    }
    if (searchStr.includes('glass') || searchStr.includes('eye') || searchStr.includes('очк') ||
        searchStr.includes('монокль') || searchStr.includes('маск')) {
        return {
            position: 'absolute' as const,
            top: `${14 * s}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${22 * s}px`,
            zIndex: 20,
        };
    }
    if (searchStr.includes('scarf') || searchStr.includes('tie') || searchStr.includes('bow') ||
        searchStr.includes('collar') || searchStr.includes('шарф') || searchStr.includes('галст') ||
        searchStr.includes('бабочк') || searchStr.includes('ошейник')) {
        return {
            position: 'absolute' as const,
            top: `${48 * s}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${24 * s}px`,
            zIndex: 15,
        };
    }
    return {
        position: 'absolute' as const,
        bottom: `${-5 * s}px`,
        right: `${-10 * s}px`,
        fontSize: `${20 * s}px`,
        zIndex: 5,
    };
};

export default function CatOleg({
    equippedItemIds,
    ownedItems,
    size = 'md',
    interactive = true,
    onJump,
}: CatOlegProps) {
    const [mood, setMood] = useState<CatMood>('idle');
    const [isAnimating, setIsAnimating] = useState(false);

    const equipped = ownedItems
        .filter((i) => equippedItemIds.includes(i.itemId))
        .map(i => ({ ...i.item, userShopId: i.id }));

    const sizeMap = {
        sm: 'text-5xl',
        md: 'text-7xl',
        lg: 'text-9xl'
    };
    const containerMap = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-40 h-40'
    };

    const handleClick = () => {
        if (!interactive || isAnimating) return;
        setIsAnimating(true);
        setMood('jump');
        onJump?.();

        setTimeout(() => {
            setMood('happy');
            setTimeout(() => {
                setMood('idle');
                setIsAnimating(false);
            }, 1000);
        }, 600);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isAnimating && interactive) {
                const random = Math.random();
                if (random > 0.7) {
                    setMood('happy');
                    setTimeout(() => setMood('idle'), 1500);
                }
            }
        }, 8000);
        return () => clearInterval(interval);
    }, [isAnimating, interactive]);

    return (
        <div className="flex flex-col items-center select-none group">
            <div
                className={`relative ${containerMap[size]} flex items-center justify-center cursor-pointer transition-transform active:scale-95`}
                onClick={handleClick}
                style={{
                    animation: mood === 'jump' ? 'catJump 0.6s ease-in-out' : mood === 'happy' ? 'catWiggle 0.4s ease-in-out' : 'catFloat 3s ease-in-out infinite',
                }}
            >
                <span className={`${sizeMap[size]} drop-shadow-md z-0`}>{CAT_FRAMES[mood]}</span>

                {equipped.map((item) => (
                    <span
                        key={item.userShopId}
                        style={getItemStyle(item.id, item.name, item.description, size)}
                        className="drop-shadow-sm pointer-events-none transition-all duration-300 animate-in fade-in zoom-in-50"
                    >
                        {item.icon?.startsWith('/') || item.icon?.startsWith('http') ? (
                            <img src={item.icon} className="w-full h-full object-contain" alt="" />
                        ) : (
                            item.icon
                        )}
                    </span>
                ))}

                {isAnimating && mood === 'jump' && (
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                )}
            </div>

            {interactive && size !== 'sm' && (
                <div className="mt-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-primary transition-colors">
                        {mood === 'idle' ? 'Кот Олег' : mood === 'happy' ? 'Мр-р! 🐾' : 'Уи-и! 🚀'}
                    </p>
                </div>
            )}

            <style>{`
                @keyframes catJump {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-30px) rotate(10deg); }
                }
                @keyframes catWiggle {
                    0%, 100% { transform: rotate(0); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
                @keyframes catFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>
        </div>
    );
}
