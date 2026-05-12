import { useEffect, type MutableRefObject } from 'react';

export function useOrbitalEllipseAnimation(
    slotRefs: MutableRefObject<(HTMLDivElement | null)[]>,
    count: number,
    radiusX: number,
    radiusY: number,
    itemKey: string,
) {
    useEffect(() => {
        if (count === 0) return;

        let frame = 0;
        const start = performance.now();
        const revolutionsPerSecond = 0.55 / 12;

        const tick = (now: number) => {
            const t = (now - start) / 1000;
            const rotation = t * revolutionsPerSecond * Math.PI * 2;

            for (let i = 0; i < count; i++) {
                const el = slotRefs.current[i];
                if (!el) continue;
                const base = (i / count) * Math.PI * 2;
                const ang = base + rotation;
                const x = Math.cos(ang) * radiusX;
                const y = Math.sin(ang) * radiusY;
                const front = (Math.sin(ang) + 1) / 2;
                const scale = 0.72 + front * 0.36;
                const z = Math.round(6 + front * 32);
                el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`;
                el.style.zIndex = String(z);
            }
            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [count, radiusX, radiusY, itemKey, slotRefs]);
}
