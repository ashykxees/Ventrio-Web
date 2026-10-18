import Link from "next/link";
import { Notice } from "@/components/ui";

export function AdminListHeader({
  title,
  newHref,
  newLabel,
  saved,
  deleted,
}: {
  title: string;
  newHref?: string;
  newLabel?: string;
  saved?: boolean;
  deleted?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold text-cream">{title}</h1>
        {newHref && (
          <Link
            href={newHref}
            className="btn btn-gold btn-sm"
          >
            {newLabel}
          </Link>
        )}
      </div>
      {saved && <Notice tone="success">Saved.</Notice>}
      {deleted && <Notice tone="success">Deleted.</Notice>}
    </div>
  );
}

export function AdminTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty: boolean;
}) {
  if (empty) {
    return <p className="card px-6 py-12 text-center text-sm text-slate">Nothing here yet.</p>;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-line text-xs tracking-wide text-slate uppercase">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 font-medium"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export const cell = "px-4 py-3 align-top text-slate";
