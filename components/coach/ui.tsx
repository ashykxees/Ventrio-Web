import Link from "next/link";
import { Badge } from "@/components/ui";
import { STATUS_TONE } from "@/lib/coach/constants";
import { labelFor } from "@/lib/constants";

export function StatusBadge({ status, options }: { status: string; options: { value: string; label: string }[] }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{labelFor(options, status)}</Badge>;
}

export function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-cream">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-sm font-semibold tracking-[0.14em] text-cream uppercase">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, href }: { label: string; value: React.ReactNode; note?: string; href?: string }) {
  const content = (
    <>
      <p className="text-xs tracking-wide text-slate uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-cream">{value}</p>
      {note && <p className="mt-1 text-xs text-slate">{note}</p>}
    </>
  );

  return href ? (
    <Link
      href={href}
      className="card card-hover block p-5"
    >
      {content}
    </Link>
  ) : (
    <div className="card p-5">{content}</div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-sm text-slate">{children}</p>;
}

export function Row({ href, children }: { href?: string; children: React.ReactNode }) {
  const className = "flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between";

  return href ? (
    <Link
      href={href}
      className={`${className} -mx-2 rounded-md px-2 hover:bg-panel`}
    >
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-line">{children}</div>;
}

export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-slate uppercase">{label}</dt>
      <dd className="mt-1 text-sm whitespace-pre-line text-cream">{children || "—"}</dd>
    </div>
  );
}

export function LinkList({ text }: { text: string }) {
  const links = text.split(/\s+/).filter((link) => /^https:\/\//i.test(link));

  if (links.length === 0) {
    return <span className="text-slate">—</span>;
  }

  return (
    <ul className="space-y-1">
      {links.map((link) => (
        <li key={link}>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-gold hover:text-gold-soft"
          >
            {link}
          </a>
        </li>
      ))}
    </ul>
  );
}
