import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import type { UserShopItem, ShopItem } from '@/types';
import CatBodyAnimated, { type CatMood } from '@/components/cat/CatBodyAnimated';
import CatLottieFloor from '@/components/cat/CatLottieFloor';
import { BuiltinTailRibbonG } from '@/components/cat/builtinTailWear';
import { getBuiltinWearComponent } from '@/components/cat/builtinCatWear';
import { catTailPivotPercent } from '@/components/cat/catViewBox';
import {
    layoutForWearRender,
    wearLayoutStyle,
    usesBuiltinVectorWear,
    getWearSlot,
} from '@/lib/catWear';

interface CatOlegProps {
    equippedItemIds: string[];
    ownedItems: UserShopItem[];
    /** Устарело: всегда игнорируется, тело только SVG-кот с гардеробом */
    catSkinLottieSrc?: string | null;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onJump?: () => void;
}

const containerMap = {
    sm: 'w-[4.25rem] min-w-[4.25rem] aspect-[200/280]',
    md: 'w-32 min-w-32 aspect-[200/280]',
    lg: 'w-52 min-w-52 aspect-[200/280]',
};

const emojiSizeClass = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
} as const;

function WearLayer({
    item,
    size,
    mood,
    tailPivot,
}: {
    item: ShopItem & { userShopId: string };
    size: 'sm' | 'md' | 'lg';
    mood: CatMood;
    tailPivot: { x: string; y: string };
}) {
    const layout = layoutForWearRender(item);
    const slot = getWearSlot(item);

    const url =
        item.imageUrl ||
        (item.icon?.startsWith('/') || item.icon?.startsWith('http')
            ? item.icon
            : null);

    const Builtin = getBuiltinWearComponent(item.id);
    const showBuiltin = Boolean(Builtin && usesBuiltinVectorWear(item));

    /* PNG/URL на хвосте: вращаем весь inset-0 вокруг базы хвоста */
    if (slot === 'TAIL' && url && !showBuiltin) {
        return (
            <div
                key={item.userShopId}
                className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out animate-in fade-in zoom-in-[0.92]"
                style={{
                    zIndex: layout.zIndex,
                    transformOrigin: `${tailPivot.x} ${tailPivot.y}`,
                    animation: 'catTailSwaySync 2.55s ease-in-out infinite',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: `${layout.anchorX * 100}%`,
                        top: `${layout.anchorY * 100}%`,
                        width: `${layout.widthPercent * 100}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <img
                        src={url}
                        alt=""
                        className="w-full h-full object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)]"
                        draggable={false}
                    />
                </div>
            </div>
        );
    }

    const style: CSSProperties = wearLayoutStyle(layout);

    if (showBuiltin && Builtin) {
        return (
            <div
                key={item.userShopId}
                style={style}
                className="transition-all duration-300 ease-out animate-in fade-in zoom-in-[0.92]"
            >
                <Builtin mood={mood} />
            </div>
        );
    }

    if (url) {
        return (
            <div
                key={item.userShopId}
                style={style}
                className="transition-all duration-300 ease-out animate-in fade-in zoom-in-[0.92]"
            >
                <img
                    src={url}
                    alt=""
                    className="w-full h-full object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)]"
                    draggable={false}
                />
            </div>
        );
    }

    if (slot === 'TAIL' && item.icon && !url && !showBuiltin) {
        return (
            <div
                key={item.userShopId}
                className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out animate-in fade-in zoom-in-[0.92] flex items-center justify-center"
                style={{
                    zIndex: layout.zIndex,
                    transformOrigin: `${tailPivot.x} ${tailPivot.y}`,
                    animation: 'catTailSwaySync 2.55s ease-in-out infinite',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: `${layout.anchorX * 100}%`,
                        top: `${layout.anchorY * 100}%`,
                        width: `${layout.widthPercent * 100}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    className="flex items-center justify-center"
                >
                    <span
                        className={`leading-none drop-shadow-md select-none ${emojiSizeClass[size]}`}
                    >
                        {item.icon}
                    </span>
                </div>
            </div>
        );
    }

    if (item.icon) {
        return (
            <div
                key={item.userShopId}
                style={style}
                className="transition-all duration-300 ease-out animate-in fade-in zoom-in-[0.92] flex items-center justify-center"
            >
                <span
                    className={`flex items-center justify-center w-full h-full leading-none drop-shadow-md select-none ${emojiSizeClass[size]}`}
                >
                    {item.icon}
                </span>
            </div>
        );
    }

    return null;
}

function SparkleBurst({ active }: { active: boolean }) {
    if (!active) return null;
    const rays = [0, 55, 110, 165, 220, 275];
    return (
        <div
            className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center"
            aria-hidden
        >
            {rays.map((deg, i) => (
                <span
                    key={deg}
                    className="absolute left-1/2 top-1/2 h-0 w-0"
                    style={{ transform: `rotate(${deg}deg)` }}
                >
                    <span
                        className="absolute left-1/2 top-0 h-2 w-2 -ml-1 -mt-1 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.95)] cat-spark-pop"
                        style={{ animationDelay: `${i * 35}ms` }}
                    />
                </span>
            ))}
        </div>
    );
}

export default function CatOleg({
    equippedItemIds,
    ownedItems,
    catSkinLottieSrc: _catSkinLottieSrc = null,
    size = 'md',
    interactive = true,
    onJump,
}: CatOlegProps) {
    void _catSkinLottieSrc;
    const [mood, setMood] = useState<CatMood>('idle');
    const [isAnimating, setIsAnimating] = useState(false);
    const [sparkle, setSparkle] = useState(false);

    const tailPivot = useMemo(() => catTailPivotPercent(), []);

    const { layers, tailRibbonInside } = useMemo(() => {
        const list = ownedItems
            .filter((i) => equippedItemIds.includes(i.itemId))
            .map((i) => ({ ...i.item, userShopId: i.id }));

        const ribbon =
            list.find(
                (it) =>
                    it.id === 'cat_tail_ribbon' &&
                    usesBuiltinVectorWear(it),
            ) ?? null;

        const withoutInsideTail = list.filter(
            (it) =>
                !(
                    it.id === 'cat_tail_ribbon' &&
                    usesBuiltinVectorWear(it)
                ),
        );

        const sorted = withoutInsideTail.sort(
            (a, b) =>
                layoutForWearRender(a).zIndex -
                layoutForWearRender(b).zIndex,
        );

        return {
            layers: sorted,
            tailRibbonInside: ribbon,
        };
    }, [ownedItems, equippedItemIds]);

    const containerAnim =
        mood === 'jump'
            ? 'catJumpGame 0.72s cubic-bezier(0.34, 1.56, 0.64, 1)'
            : mood === 'happy'
              ? 'catHappyPop 0.55s cubic-bezier(0.34, 1.45, 0.64, 1)'
              : 'none';

    const handleClick = () => {
        if (!interactive || isAnimating) return;
        setIsAnimating(true);
        setSparkle(true);
        setMood('jump');
        onJump?.();
        setTimeout(() => setSparkle(false), 520);

        setTimeout(() => {
            setMood('happy');
            setTimeout(() => {
                setMood('idle');
                setIsAnimating(false);
            }, 900);
        }, 620);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isAnimating && interactive) {
                if (Math.random() > 0.72) {
                    setMood('happy');
                    setTimeout(() => setMood('idle'), 1400);
                }
            }
        }, 9000);
        return () => clearInterval(interval);
    }, [isAnimating, interactive]);

    return (
        <div className="flex flex-col items-center select-none group">
            <div
                className={`relative ${containerMap[size]} flex items-center justify-center cursor-pointer transition-[filter] duration-200 active:scale-[0.97] hover:drop-shadow-[0_8px_24px_rgba(249,115,22,0.2)] rounded-[1.75rem] bg-gradient-to-b from-white/80 to-slate-50/90 ring-1 ring-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]`}
                onClick={handleClick}
                style={{ animation: containerAnim }}
            >
                <CatLottieFloor />
                <motion.div
                    className="absolute inset-[5%] z-0 pointer-events-none"
                    animate={
                        mood === 'idle' && !isAnimating
                            ? { y: [0, -6, 0] }
                            : { y: 0 }
                    }
                    transition={
                        mood === 'idle' && !isAnimating
                            ? { repeat: Infinity, duration: 3.2, ease: 'easeInOut' }
                            : { duration: 0.2 }
                    }
                >
                    <CatBodyAnimated
                        mood={mood}
                        tailWear={
                            tailRibbonInside ? (
                                <BuiltinTailRibbonG />
                            ) : undefined
                        }
                    />
                </motion.div>

                {layers.map((item) => (
                    <WearLayer
                        key={item.userShopId}
                        item={item}
                        size={size}
                        mood={mood}
                        tailPivot={tailPivot}
                    />
                ))}

                <SparkleBurst active={sparkle} />

                {isAnimating && mood === 'jump' && (
                    <div className="absolute inset-0 rounded-[1.5rem] border-2 border-primary/30 animate-ping z-[55] pointer-events-none" />
                )}

                <style>{`
                @keyframes catTailSwaySync {
                    0%, 100% { transform: rotate(-9deg); }
                    50% { transform: rotate(12deg); }
                }
                @keyframes catJumpGame {
                    0% { transform: translateY(0) scale(1, 1) rotate(0deg); }
                    15% { transform: translateY(4px) scale(1.06, 0.92) rotate(-2deg); }
                    45% { transform: translateY(-36px) scale(0.94, 1.08) rotate(8deg); }
                    70% { transform: translateY(-8px) scale(1.02, 0.98) rotate(-3deg); }
                    100% { transform: translateY(0) scale(1, 1) rotate(0deg); }
                }
                @keyframes catHappyPop {
                    0% { transform: scale(1) rotate(0deg); }
                    30% { transform: scale(1.08) rotate(-6deg); }
                    60% { transform: scale(1.06) rotate(6deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                @keyframes catSparkPop {
                    0% { opacity: 0; transform: rotate(0deg) translateY(0) scale(0.2); }
                    35% { opacity: 1; }
                    100% { opacity: 0; transform: rotate(0deg) translateY(-46px) scale(1.2); }
                }
                .cat-spark-pop {
                    animation: catSparkPop 0.5s ease-out forwards;
                }
            `}</style>
            </div>

            {interactive && size !== 'sm' && (
                <div className="mt-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">
                        {mood === 'idle'
                            ? 'Тапни Олега'
                            : mood === 'happy'
                              ? 'Мррр! ✨'
                              : 'Уиии!'}
                    </p>
                </div>
            )}
        </div>
    );
}
