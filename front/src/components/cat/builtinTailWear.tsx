/**
 * Рисуется ВНУТРИ <g> хвоста — качается вместе с ним.
 */
export function BuiltinTailRibbonG() {
    return (
        <g>
            <ellipse
                cx="26"
                cy="132"
                rx="12"
                ry="8"
                fill="#ff7eb3"
                stroke="#c2185b"
                strokeWidth="1"
                transform="rotate(-28 26 132)"
            />
            <path d="M 18 136 L 10 158 L 20 152 Z" fill="#ffc2d9" stroke="#e91e8c" strokeWidth="0.5" />
            <path d="M 34 136 L 42 158 L 32 152 Z" fill="#ffc2d9" stroke="#e91e8c" strokeWidth="0.5" />
            <ellipse cx="26" cy="130" rx="3.5" ry="2.8" fill="#fff5f8" opacity={0.75} />
        </g>
    );
}
