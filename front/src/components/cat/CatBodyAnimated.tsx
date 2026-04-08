import { useId, type ReactNode } from 'react';
import { CAT_VB, CAT_TAIL_PIVOT } from '@/components/cat/catViewBox';

export type CatMood = 'idle' | 'happy' | 'jump';

interface CatBodyAnimatedProps {
    mood: CatMood;
    className?: string;
    tailWear?: ReactNode;
}

/**
 * Упрощённый «чиби»-кот: мягкие формы, тёплая палитра, без шума и лишней детализации.
 * Хвост — CAT_TAIL_PIVOT; лента на хвосте (builtin) рассчитана на те же user-space координаты.
 */
export default function CatBodyAnimated({
    mood,
    className = '',
    tailWear,
}: CatBodyAnimatedProps) {
    const uid = useId().replace(/:/g, '');
    const g = (s: string) => `${uid}-${s}`;

    const ox = CAT_TAIL_PIVOT.x;
    const oy = CAT_TAIL_PIVOT.y;

    return (
        <svg
            viewBox={CAT_VB}
            className={`block w-full h-full select-none ${className}`}
            aria-hidden
        >
            <defs>
                <linearGradient id={g('coat')} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fdba74" />
                    <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <linearGradient id={g('coatHi')} x1="20%" y1="15%" x2="80%" y2="85%">
                    <stop offset="0%" stopColor="#ffedd5" />
                    <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
                <linearGradient id={g('innerEar')} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffe4e6" />
                    <stop offset="100%" stopColor="#fda4af" />
                </linearGradient>
            </defs>

            <style>{`
                @keyframes ${g('tail')} {
                    0%, 100% { transform: rotate(-6deg); }
                    50% { transform: rotate(7deg); }
                }
                @keyframes ${g('earL')} {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(-2deg); }
                }
                @keyframes ${g('earR')} {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(2deg); }
                }
                @keyframes ${g('breathe')} {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.012); }
                }
                @keyframes ${g('blink')} {
                    0%, 92%, 100% { transform: scaleY(1); }
                    94%, 97% { transform: scaleY(0.06); }
                }
                @keyframes ${g('shadow')} {
                    0%, 100% { opacity: 0.22; transform: scaleX(1); }
                    50% { opacity: 0.14; transform: scaleX(0.94); }
                }
                .${g('tail')} {
                    animation: ${g('tail')} 2.55s ease-in-out infinite;
                    transform-origin: ${ox}px ${oy}px;
                }
                .${g('earL')} { animation: ${g('earL')} 3.1s ease-in-out infinite; transform-origin: 70px 76px; }
                .${g('earR')} { animation: ${g('earR')} 3.25s ease-in-out infinite; transform-origin: 130px 76px; }
                .${g('breathe')} { animation: ${g('breathe')} 3.75s ease-in-out infinite; transform-origin: 100px 200px; }
                .${g('blink')} { animation: ${g('blink')} 4.8s ease-in-out infinite; transform-origin: 100px 112px; }
                .${g('shadow')} { animation: ${g('shadow')} 3.75s ease-in-out infinite; transform-origin: 100px 268px; }
            `}</style>

            <ellipse
                cx="100"
                cy="268"
                rx="54"
                ry="9"
                fill="rgba(15, 23, 42, 0.2)"
                className={g('shadow')}
            />

            {/* Хвост: короче, слева, не уходит над голову — лента ~ (26, 132) */}
            <g className={g('tail')}>
                <path
                    d="M 52 220
                       C 34 218 20 200 18 178
                       C 16 158 22 138 34 126
                       C 40 120 48 118 54 122
                       L 58 130
                       C 48 134 38 150 34 170
                       C 30 194 38 214 52 220 Z"
                    fill={`url(#${g('coat')})`}
                    stroke="#c2410c"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />
                <path
                    d="M 40 168 Q 28 150 32 128"
                    fill="none"
                    stroke="#9a3412"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity={0.25}
                />
                {tailWear}
            </g>

            <g className={g('breathe')}>
                {/* Туловище */}
                <ellipse
                    cx="100"
                    cy="208"
                    rx="46"
                    ry="40"
                    fill={`url(#${g('coatHi')})`}
                    stroke="#c2410c"
                    strokeWidth="1.2"
                />
                <ellipse
                    cx="100"
                    cy="212"
                    rx="28"
                    ry="22"
                    fill="#fff7ed"
                    opacity={0.85}
                />

                {/* Задние лапки (контур) */}
                <ellipse cx="62" cy="228" rx="14" ry="10" fill={`url(#${g('coat')})`} stroke="#c2410c" strokeWidth="1" />
                <ellipse cx="138" cy="228" rx="14" ry="10" fill={`url(#${g('coat')})`} stroke="#c2410c" strokeWidth="1" />

                {/* Голова — почти круг */}
                <circle
                    cx="100"
                    cy="118"
                    r="54"
                    fill={`url(#${g('coatHi')})`}
                    stroke="#c2410c"
                    strokeWidth="1.2"
                />

                <g className={g('earL')}>
                    <path
                        d="M 58 92 C 52 56 62 40 76 48 C 86 54 88 72 82 92 C 76 100 64 100 58 92 Z"
                        fill={`url(#${g('coat')})`}
                        stroke="#c2410c"
                        strokeWidth="1"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M 72 78 C 68 58 72 52 78 56 C 82 60 80 78 76 86 C 74 88 72 84 72 78 Z"
                        fill={`url(#${g('innerEar')})`}
                    />
                </g>
                <g className={g('earR')}>
                    <path
                        d="M 142 92 C 148 56 138 40 124 48 C 114 54 112 72 118 92 C 124 100 136 100 142 92 Z"
                        fill={`url(#${g('coat')})`}
                        stroke="#c2410c"
                        strokeWidth="1"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M 128 78 C 132 58 128 52 122 56 C 118 60 120 78 124 86 C 126 88 128 84 128 78 Z"
                        fill={`url(#${g('innerEar')})`}
                    />
                </g>

                {/* Мордочка */}
                <ellipse cx="100" cy="128" rx="36" ry="28" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.8" />
                <ellipse cx="100" cy="124" rx="5" ry="4" fill="#fda4af" />
                <path
                    d="M 100 130 Q 100 134 100 136"
                    stroke="#9a3412"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.55}
                />

                <g stroke="#94a3b8" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity={0.35}>
                    <path d="M 52 120 L 22 116" />
                    <path d="M 52 128 L 18 128" />
                    <path d="M 148 120 L 178 116" />
                    <path d="M 148 128 L 182 128" />
                </g>

                {/* Передние лапы — мягкие овалы */}
                <ellipse cx="86" cy="232" rx="16" ry="20" fill={`url(#${g('coat')})`} stroke="#c2410c" strokeWidth="1" />
                <ellipse cx="114" cy="232" rx="16" ry="20" fill={`url(#${g('coat')})`} stroke="#c2410c" strokeWidth="1" />
                <ellipse cx="86" cy="242" rx="10" ry="7" fill="#ffe4e6" opacity={0.9} />
                <ellipse cx="114" cy="242" rx="10" ry="7" fill="#ffe4e6" opacity={0.9} />

                <g style={{ opacity: mood === 'idle' ? 1 : 0, transition: 'opacity 0.16s ease' }}>
                    <g className={g('blink')}>
                        <circle cx="78" cy="114" r="11" fill="#fafaf9" stroke="#78716c" strokeWidth="1.1" />
                        <circle cx="122" cy="114" r="11" fill="#fafaf9" stroke="#78716c" strokeWidth="1.1" />
                        <circle cx="78" cy="116" r="6" fill="#44403c" />
                        <circle cx="122" cy="116" r="6" fill="#44403c" />
                        <circle cx="75" cy="111" r="2.8" fill="#ffffff" />
                        <circle cx="119" cy="111" r="2.8" fill="#ffffff" />
                    </g>
                </g>

                <g style={{ opacity: mood === 'happy' ? 1 : 0, transition: 'opacity 0.16s ease' }}>
                    <path
                        d="M 66 112 Q 78 124 90 112"
                        fill="none"
                        stroke="#292524"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 110 112 Q 122 124 134 112"
                        fill="none"
                        stroke="#292524"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 88 138 Q 100 144 112 138"
                        fill="none"
                        stroke="#c2410c"
                        strokeWidth="1"
                        strokeLinecap="round"
                        opacity={0.4}
                    />
                </g>

                <g style={{ opacity: mood === 'jump' ? 1 : 0, transition: 'opacity 0.16s ease' }}>
                    <circle cx="78" cy="112" r="13" fill="#fafaf9" stroke="#78716c" strokeWidth="1" />
                    <circle cx="122" cy="112" r="13" fill="#fafaf9" stroke="#78716c" strokeWidth="1" />
                    <circle cx="78" cy="114" r="7" fill="#44403c" />
                    <circle cx="122" cy="114" r="7" fill="#44403c" />
                    <circle cx="74" cy="108" r="3" fill="#ffffff" />
                    <circle cx="118" cy="108" r="3" fill="#ffffff" />
                    <ellipse cx="100" cy="142" rx="10" ry="6" fill="#292524" />
                </g>
            </g>
        </svg>
    );
}
