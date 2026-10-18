import Link from "next/link";

type MarkProps = {
  className?: string;
  title?: string;
};

export function VMark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 100 85"
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <polygon points="0,0 24.3,0 59.6,67.4 49.4,84.5" />
      <polygon points="78.1,0 100,0 94,7.4 55.3,34" />
      <polygon points="89.4,19.1 62.8,34.9 55.7,48.1 62.1,62.8" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-3 ${className}`}
      aria-label="Ventrio home"
    >
      <VMark className="h-6 w-auto text-gold transition-transform duration-200 group-hover:-translate-y-0.5" />
      <span className="font-display text-sm font-semibold tracking-[0.42em] text-cream">VENTRIO</span>
    </Link>
  );
}
