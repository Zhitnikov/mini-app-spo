import Lottie from 'lottie-react';
import floorGlow from '@/assets/lottie/floor-glow.json';

/** Пульсирующее бирюзовое свечение под лапами (Lottie). */
export default function CatLottieFloor({ className = '' }: { className?: string }) {
    return (
        <div
            className={`pointer-events-none absolute left-1/2 bottom-[1%] z-[1] w-[90%] -translate-x-1/2 opacity-[0.85] ${className}`}
            aria-hidden
        >
            <Lottie animationData={floorGlow} loop className="mx-auto h-12 w-full max-h-14" />
        </div>
    );
}
