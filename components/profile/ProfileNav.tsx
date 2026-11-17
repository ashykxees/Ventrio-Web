"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Group = { label: string; items: { href: string; label: string }[] };

export function ProfileNav({ groups }: { groups: Group[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Profile sections"
      className="-mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 pb-3 lg:mx-0 lg:block lg:space-y-7 lg:overflow-visible lg:border-0 lg:px-0 lg:pb-0"
    >
      {groups.map((group) => (
        <div
          key={group.label}
          className="shrink-0"
        >
          <p className="hidden px-3 font-display text-[0.65rem] font-semibold tracking-[0.2em] text-slate uppercase lg:block">
            {group.label}
          </p>
          <ul className="flex gap-1 lg:mt-2 lg:block lg:space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                      active ? "bg-gold/10 font-medium text-gold" : "text-slate hover:bg-white/5 hover:text-cream"
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
