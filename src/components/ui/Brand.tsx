export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[13px] bg-accent text-black shadow-[0_0_24px_rgba(205,245,100,0.2)] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[62%]">
        <path
          d="M7 8.5v7M4.5 10v4M17 8.5v7M19.5 10v4M7 12h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M2.5 12h2M19.5 12h2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </span>
  )
}

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-none">
        <div className="text-[15px] font-bold tracking-[-0.02em] text-white">
          подход<span className="text-accent">.</span>
        </div>
        <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-600">
          дневник силы
        </div>
      </div>
    </div>
  )
}
