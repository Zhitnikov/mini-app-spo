import type { FC } from 'react';
import type { CatMood } from '@/components/cat/CatBodyAnimated';
import { CAT_VB } from '@/components/cat/catViewBox';

type P = { mood?: CatMood; className?: string };

const sh = 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))';

export const BuiltinCrownGold: FC<P> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={{ filter: sh }} aria-hidden>
        <path
            d="M 58 78 L 68 42 L 84 58 L 100 34 L 116 58 L 132 42 L 142 78 L 100 70 Z"
            fill="#fdcb6e"
            stroke="#b8860b"
            strokeWidth="1.3"
        />
        <path d="M 62 70 L 100 62 L 138 70" fill="none" stroke="#f39c12" strokeWidth="1" opacity={0.5} />
        <circle cx="72" cy="44" r="3.5" fill="#fffef0" stroke="#f1c40f" strokeWidth="0.5" />
        <circle cx="100" cy="38" r="4" fill="#fffef0" stroke="#f1c40f" strokeWidth="0.5" />
        <circle cx="128" cy="44" r="3.5" fill="#fffef0" stroke="#f1c40f" strokeWidth="0.5" />
        <rect x="64" y="72" width="72" height="10" rx="2" fill="#d4a017" stroke="#9a7d0a" strokeWidth="0.9" />
    </svg>
);

export const BuiltinBowtieVelvet: FC<P> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={{ filter: sh }} aria-hidden>
        <path d="M 100 152 L 74 138 L 74 168 L 100 158 Z" fill="#6a1b9a" stroke="#4a148c" strokeWidth="1.1" />
        <path d="M 100 152 L 126 138 L 126 168 L 100 158 Z" fill="#6a1b9a" stroke="#4a148c" strokeWidth="1.1" />
        <ellipse cx="100" cy="153" rx="9" ry="11" fill="#4a148c" />
        <path d="M 82 148 Q 100 154 118 148" fill="none" stroke="#ab47bc" strokeWidth="0.8" opacity={0.5} />
    </svg>
);

export const BuiltinPearlNecklace: FC<P> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={{ filter: sh }} aria-hidden>
        <path d="M 52 158 Q 100 182 148 158" fill="none" stroke="#eceff1" strokeWidth="4" strokeLinecap="round" opacity={0.85} />
        {[
            [60, 164],
            [74, 172],
            [90, 178],
            [100, 180],
            [110, 178],
            [126, 172],
            [140, 164],
        ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.5" fill="#fffefb" stroke="#cfd8dc" strokeWidth="0.8" />
        ))}
    </svg>
);

export const BuiltinHoodieZip: FC<P> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={{ filter: sh }} aria-hidden>
        <path
            d="M 46 168 L 50 252 Q 100 268 150 252 L 154 168 Q 120 158 100 172 Q 80 158 46 168 Z"
            fill="#546e7a"
            stroke="#37474f"
            strokeWidth="1.5"
        />
        <path d="M 70 162 Q 100 138 130 162 L 126 176 Q 100 156 74 176 Z" fill="#607d8b" stroke="#455a64" strokeWidth="1.1" />
        <line x1="100" y1="176" x2="100" y2="252" stroke="#b0bec5" strokeWidth="2.2" />
        {[188, 204, 220, 236].map((y) => (
            <rect key={y} x="97" y={y} width="6" height="5" rx="1" fill="#eceff1" stroke="#90a4ae" strokeWidth="0.4" />
        ))}
        <path d="M 58 188 Q 70 184 82 190" fill="none" stroke="#455a64" strokeWidth="1.2" opacity={0.5} />
        <path d="M 142 188 Q 130 184 118 190" fill="none" stroke="#455a64" strokeWidth="1.2" opacity={0.5} />
    </svg>
);

export const BuiltinDenimJacket: FC<P> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={{ filter: sh }} aria-hidden>
        <path
            d="M 44 170 L 48 254 Q 100 270 152 254 L 156 170 Q 128 162 100 178 Q 72 162 44 170 Z"
            fill="#3f51b5"
            stroke="#283593"
            strokeWidth="1.4"
        />
        <path d="M 100 178 L 100 258" stroke="#1a237e" strokeWidth="2" />
        <path d="M 62 176 L 78 188 M 138 176 L 122 188" stroke="#5c6bc0" strokeWidth="2" strokeLinecap="round" />
        <rect x="76" y="192" width="16" height="14" rx="1" fill="#e8eaf6" stroke="#3949ab" strokeWidth="0.6" />
        <rect x="108" y="192" width="16" height="14" rx="1" fill="#e8eaf6" stroke="#3949ab" strokeWidth="0.6" />
        <circle cx="88" cy="214" r="2.2" fill="#c5cae9" stroke="#3949ab" strokeWidth="0.5" />
        <circle cx="112" cy="214" r="2.2" fill="#c5cae9" stroke="#3949ab" strokeWidth="0.5" />
        <circle cx="88" cy="232" r="2.2" fill="#c5cae9" stroke="#3949ab" strokeWidth="0.5" />
        <circle cx="112" cy="232" r="2.2" fill="#c5cae9" stroke="#3949ab" strokeWidth="0.5" />
        <path d="M 52 200 Q 64 196 76 202" fill="none" stroke="#7986cb" strokeWidth="1" opacity={0.45} />
        <path d="M 148 200 Q 136 196 124 202" fill="none" stroke="#7986cb" strokeWidth="1" opacity={0.45} />
    </svg>
);

export const BuiltinSneakersHi: FC<P> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={{ filter: sh }} aria-hidden>
        <path
            d="M 48 252 Q 72 238 96 252 L 98 268 Q 72 274 46 268 Z"
            fill="#37474f"
            stroke="#263238"
            strokeWidth="1.3"
        />
        <path
            d="M 104 252 Q 128 238 152 252 L 154 268 Q 128 274 102 268 Z"
            fill="#37474f"
            stroke="#263238"
            strokeWidth="1.3"
        />
        <path d="M 52 256 Q 72 248 92 256" fill="none" stroke="#ff5252" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 108 256 Q 128 248 148 256" fill="none" stroke="#ff5252" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="72" cy="262" rx="14" ry="6" fill="#455a64" />
        <ellipse cx="128" cy="262" rx="14" ry="6" fill="#455a64" />
        <path d="M 58 262 L 58 268 M 86 262 L 86 268" stroke="#eceff1" strokeWidth="1.5" strokeLinecap="round" opacity={0.4} />
        <path d="M 114 262 L 114 268 M 142 262 L 142 268" stroke="#eceff1" strokeWidth="1.5" strokeLinecap="round" opacity={0.4} />
    </svg>
);

export const BuiltinBootsCombat: FC<P> = ({ className = '' }) => (
    <svg viewBox={CAT_VB} className={`block w-full h-full select-none ${className}`} style={{ filter: sh }} aria-hidden>
        <path d="M 46 244 L 50 272 L 92 276 L 96 248 Q 72 238 46 244 Z" fill="#3e2723" stroke="#1b120c" strokeWidth="1.3" />
        <path d="M 104 244 L 108 272 L 150 276 L 154 248 Q 128 238 104 244 Z" fill="#3e2723" stroke="#1b120c" strokeWidth="1.3" />
        <path d="M 52 252 H 88 M 52 260 H 88" stroke="#6d4c41" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 112 252 H 148 M 112 260 H 148" stroke="#6d4c41" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="58" y="248" width="26" height="8" rx="1" fill="#5d4037" stroke="#3e2723" strokeWidth="0.6" />
        <rect x="116" y="248" width="26" height="8" rx="1" fill="#5d4037" stroke="#3e2723" strokeWidth="0.6" />
        <ellipse cx="72" cy="268" rx="20" ry="7" fill="#4e342e" />
        <ellipse cx="128" cy="268" rx="20" ry="7" fill="#4e342e" />
    </svg>
);

/** Хвостовой бант — только через BuiltinTailRibbonG внутри CatBodyAnimated */
export const CATALOG_WEAR_MAP: Record<string, FC<P>> = {
    cat_crown_gold: BuiltinCrownGold,
    cat_bowtie_velvet: BuiltinBowtieVelvet,
    cat_pearl_necklace: BuiltinPearlNecklace,
    cat_hoodie_zip: BuiltinHoodieZip,
    cat_denim_jacket: BuiltinDenimJacket,
    cat_sneakers_hi: BuiltinSneakersHi,
    cat_boots_combat: BuiltinBootsCombat,
};
