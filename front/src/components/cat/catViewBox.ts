/** Единый холст персонажа: выше, чем квадрат — сидячий силуэт. */
export const CAT_VB = '0 0 200 280' as const;
export const CAT_VB_W = 200;
export const CAT_VB_H = 280;

/** База хвоста (user space) — для transform-origin оверлеев PNG на хвосте */
export const CAT_TAIL_PIVOT = { x: 52, y: 220 };

/** Проценты для CSS transform-origin внутри контейнера с тем же aspect ratio */
export function catTailPivotPercent(): { x: string; y: string } {
    return {
        x: `${(CAT_TAIL_PIVOT.x / CAT_VB_W) * 100}%`,
        y: `${(CAT_TAIL_PIVOT.y / CAT_VB_H) * 100}%`,
    };
}
