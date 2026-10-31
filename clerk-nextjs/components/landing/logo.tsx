export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <rect width="32" height="32" rx="9" fill="var(--volt)" />
      {/* track lanes */}
      <path
        d="M6 12.5h13.5M6 19.5h9"
        stroke="var(--primary-foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* forward chevron */}
      <path
        d="M17 9.5 24.5 16 17 22.5"
        stroke="var(--primary-foreground)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark className="h-8 w-8" />
      <span className="font-heading text-xl font-bold tracking-tight">
        Sprint
      </span>
    </span>
  )
}
