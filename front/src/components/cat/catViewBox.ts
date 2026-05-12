
export const CAT_VB = '0 0 200 280' as const;
export const CAT_VB_W = 200;
export const CAT_VB_H = 280;


export const CAT_TAIL_PIVOT = { x: 52, y: 220 };


export function catTailPivotPercent(): { x: string; y: string } {
    return {
        x: `${(CAT_TAIL_PIVOT.x / CAT_VB_W) * 100}%`,
        y: `${(CAT_TAIL_PIVOT.y / CAT_VB_H) * 100}%`,
    };
}
