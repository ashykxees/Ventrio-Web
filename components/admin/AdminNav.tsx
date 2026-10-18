"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/academy", label: "Academy" },
  { href: "/admin/competitions", label: "Competitions" },
  { href: "/admin/announcements", label: "Announcements" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto"
      aria-label="Admin"
    >
      {ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-md px-3 py-2 text-sm transition-colors ${
              active ? "bg-panel text-gold" : "text-slate hover:text-cream"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
