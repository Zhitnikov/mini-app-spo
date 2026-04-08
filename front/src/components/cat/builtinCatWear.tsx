import type { FC } from 'react';
import type { CatMood } from '@/components/cat/CatBodyAnimated';
import { CAT_VB } from '@/components/cat/catViewBox';
import { CATALOG_WEAR_MAP } from '@/components/cat/builtinWearCatalog';

export type BuiltinProps = { mood?: CatMood; className?: string };

const sh = (s: string) => ({ filter: s });

export const BuiltinWearTopHat: FC<BuiltinProps> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={sh('drop-shadow(0 5px 10px rgba(0,0,0,0.28))')} aria-hidden>
        <ellipse cx="100" cy="78" rx="40" ry="8" fill="#2d3436" stroke="#1a1a1a" strokeWidth="1" />
        <rect x="74" y="34" width="52" height="46" rx="4" fill="#434a50" stroke="#1e272e" strokeWidth="1.2" />
        <rect x="78" y="38" width="44" height="38" rx="3" fill="#5c6369" opacity={0.35} />
        <path d="M 88 38 L 100 34 L 112 38" fill="none" stroke="#636e72" strokeWidth="1" opacity={0.5} />
        <rect x="96" y="48" width="8" height="22" rx="1" fill="#2d3436" opacity={0.5} />
    </svg>
);

export const BuiltinWearGlasses: FC<BuiltinProps> = ({ mood, className = '' }) => {
    const tilt = mood === 'jump' ? 6 : mood === 'happy' ? -4 : 0;
    return (
        <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={sh('drop-shadow(0 2px 6px rgba(0,0,0,0.22))')} aria-hidden>
            <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '100px 112px' }}>
                <ellipse cx="76" cy="112" rx="19" ry="17" fill="none" stroke="#2d3436" strokeWidth="3.2" />
                <ellipse cx="124" cy="112" rx="19" ry="17" fill="none" stroke="#2d3436" strokeWidth="3.2" />
                <line x1="56" y1="110" x2="36" y2="104" stroke="#2d3436" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="144" y1="110" x2="164" y2="104" stroke="#2d3436" strokeWidth="2.8" strokeLinecap="round" />
                <ellipse cx="76" cy="112" rx="14" ry="12" fill="rgba(255,255,255,0.2)" />
                <ellipse cx="124" cy="112" rx="14" ry="12" fill="rgba(255,255,255,0.2)" />
                <line x1="95" y1="112" x2="105" y2="112" stroke="#2d3436" strokeWidth="2.5" strokeLinecap="round" />
            </g>
        </svg>
    );
};

export const BuiltinWearScarf: FC<BuiltinProps> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={sh('drop-shadow(0 4px 8px rgba(0,0,0,0.2))')} aria-hidden>
        <path
            d="M 42 158 Q 100 142 158 158 Q 164 168 160 178 Q 100 160 40 178 Q 36 168 42 158 Z"
            fill="#c0392b"
            stroke="#78281f"
            strokeWidth="1.4"
        />
        <path d="M 128 162 L 148 208 L 134 210 L 116 168 Z" fill="#922b21" stroke="#641e16" strokeWidth="1" />
        <path d="M 58 162 Q 100 174 142 162" fill="none" stroke="#fadbd8" strokeWidth="2" opacity={0.6} strokeLinecap="round" />
        <path d="M 48 154 Q 100 138 152 154" fill="none" stroke="#e74c3c" strokeWidth="1.2" opacity={0.4} strokeLinecap="round" />
    </svg>
);

export const BuiltinWearBeret: FC<BuiltinProps> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={sh('drop-shadow(0 4px 8px rgba(0,0,0,0.22))')} aria-hidden>
        <ellipse cx="88" cy="62" rx="46" ry="18" fill="#1e8449" stroke="#0b3d2c" strokeWidth="1.2" transform="rotate(-18 88 62)" />
        <ellipse cx="112" cy="72" rx="12" ry="6" fill="#0d3d22" opacity={0.5} />
        <path d="M 72 58 Q 100 48 128 58" fill="none" stroke="#27ae60" strokeWidth="1.5" opacity={0.45} strokeLinecap="round" />
    </svg>
);

const CLASSIC_MAP: Record<string, FC<BuiltinProps>> = {
    cat_hat: BuiltinWearTopHat,
    cat_glasses: BuiltinWearGlasses,
    cat_scarf: BuiltinWearScarf,
    cat_beret: BuiltinWearBeret,
};

export const BUILTIN_MAP: Record<string, FC<BuiltinProps>> = {
    ...CLASSIC_MAP,
    ...CATALOG_WEAR_MAP,
};

/** Включая хвостовой бант (рендер внутри SVG хвоста, не в BUILTIN_MAP) */
export const ALL_BUILTIN_WEAR_IDS = [...new Set([...Object.keys(BUILTIN_MAP), 'cat_tail_ribbon'])];

export function getBuiltinWearComponent(itemId: string): FC<BuiltinProps> | null {
    return BUILTIN_MAP[itemId] ?? null;
}

export const BUILTIN_WEAR_ITEM_IDS = ALL_BUILTIN_WEAR_IDS;
