"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export function CoachNav({ groups }: { groups: { title: string; items: Item[] }[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/coach" || href === "/coach/leadership" ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label="Coach dashboard">
      {groups.map((group) => (
        <div
          key={group.title}
          className="mb-6"
        >
          <p className="mb-2 px-3 font-display text-[0.62rem] font-semibold tracking-[0.24em] text-slate uppercase">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                      active ? "bg-panel text-gold" : "text-slate hover:bg-panel/60 hover:text-cream"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
