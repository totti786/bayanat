export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#1d3836" />
      <rect x="8" y="12" width="4.5" height="10" rx="1.25" fill="#f8f7f2" />
      <rect x="14" y="8" width="4.5" height="14" rx="1.25" fill="#c09a4e" />
      <rect x="20" y="15" width="4.5" height="7" rx="1.25" fill="#f8f7f2" />
    </svg>
  );
}

export function Wordmark({
  dark = false,
  compact = false,
}: {
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={`font-display font-semibold tracking-tight ${compact ? "text-base" : "text-lg"} ${dark ? "text-neutral-900" : "text-white"}`}>
        Bayanat
      </span>
      <span
        dir="rtl"
        className={`font-arabic font-semibold ${compact ? "text-[11px]" : "text-sm"} ${dark ? "text-gold-600" : "text-gold-400"}`}
      >
        بينات
      </span>
    </span>
  );
}
