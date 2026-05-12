export default function SpoMiniLogo({ className = 'w-[22px] h-[22px]' }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden
        >
            <rect width="32" height="32" rx="7" fill="#1e40af" />
            <path fill="#ffffff" d="M9 9.5h6.5a1.5 1.5 0 0 1 1.5 1.5v12H9V9.5z" />
            <path fill="#eff6ff" d="M16 9.5h6.5a1.5 1.5 0 0 1 1.5 1.5v12H16V9.5z" />
            <path fill="#1e40af" d="M15.25 9.5h1.5v14h-1.5z" />
        </svg>
    );
}
