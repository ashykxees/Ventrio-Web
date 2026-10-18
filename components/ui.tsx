import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-line">
      <div className="container-page py-16 sm:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-5 max-w-3xl text-3xl text-cream sm:text-5xl">{title}</h1>
        <span className="gold-rule mt-8" />
        {description && (
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-slate sm:text-lg">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display mt-4 text-2xl text-cream sm:text-3xl">{title}</h2>
      <span className={`gold-rule mt-6 ${centered ? "mx-auto" : ""}`} />
      {description && <p className="mt-6 leading-relaxed text-slate">{description}</p>}
    </div>
  );
}

const BADGE_TONES = {
  gold: "border-gold/40 text-gold",
  neutral: "border-line-strong text-slate",
  green: "border-emerald-400/40 text-emerald-300",
  red: "border-red-400/40 text-red-300",
  blue: "border-sky-400/40 text-sky-300",
};

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-display text-[0.62rem] font-semibold tracking-[0.18em] uppercase ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <span className="gold-rule" />
      <h3 className="display mt-6 text-lg text-cream">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "error" | "warning";
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-line-strong bg-panel text-cream",
    success: "border-emerald-400/40 bg-emerald-400/5 text-emerald-100",
    error: "border-red-400/40 bg-red-400/5 text-red-100",
    warning: "border-gold/40 bg-gold/5 text-cream",
  };

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1 opacity-90" : ""}>{children}</div>
    </div>
  );
}

export function FilterPills({
  label,
  param,
  options,
  current,
  basePath,
  searchParams,
  allLabel = "All",
}: {
  label: string;
  allLabel?: string;
  param: string;
  options: { value: string; label: string }[];
  current: string;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const hrefFor = (value: string) => {
    const params = new URLSearchParams();

    for (const [key, val] of Object.entries(searchParams)) {
      if (val && key !== param) {
        params.set(key, val);
      }
    }

    if (value) {
      params.set(param, value);
    }

    const query = params.toString();

    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label={label}
    >
      <span className="mr-2 text-xs font-medium tracking-wide text-slate uppercase">{label}</span>
      {[{ value: "", label: allLabel }, ...options].map((option) => {
        const active = current === option.value;

        return (
          <Link
            key={option.value || "all"}
            href={hrefFor(option.value)}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-gold bg-gold text-charcoal"
                : "border-line-strong text-slate hover:border-gold hover:text-cream"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

export function TextBlock({ text }: { text: string }) {
  return (
    <div className="prose-ventrio leading-relaxed text-slate">
      {text
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((paragraph, index) => (
          <p
            key={index}
            className="whitespace-pre-line"
          >
            {paragraph}
          </p>
        ))}
    </div>
  );
}
