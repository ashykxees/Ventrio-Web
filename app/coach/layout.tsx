import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { CoachNav } from "@/components/coach/CoachNav";
import { Notice } from "@/components/ui";
import { requireCoachContext } from "@/lib/coach/access";
import { COACH_NAV, LEADERSHIP_NAV } from "@/lib/coach/constants";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: { default: "Coach Dashboard", template: "%s · Coach Dashboard" },
  robots: { index: false, follow: false },
};

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireCoachContext();

  if (!ctx.canCoach && !ctx.isLeadership) {
    let message =
      "The Coach Dashboard is for Ventrio coaches. If you're a coach, ask leadership to give you a coach role in the Ventrio Discord server, then refresh this page.";

    if (!ctx.rolesVerified) {
      message = "We couldn't check your Discord roles right now. Please try again in a few minutes.";
    } else if (ctx.hasCoachRole && ctx.coach?.status === "DEACTIVATED") {
      message = "Your coach access has been deactivated. Contact Ventrio leadership if you think this is a mistake.";
    }

    return (
      <div className="container-page max-w-2xl py-20">
        <p className="eyebrow">Coach Dashboard</p>
        <h1 className="display mt-4 text-2xl text-cream">Access pending</h1>
        <span className="gold-rule mt-6" />
        <div className="mt-8">
          <Notice title="You don't have access yet">{message}</Notice>
        </div>
        <p className="mt-6 text-sm text-slate">Signed in as @{ctx.profile.discordUsername}.</p>
      </div>
    );
  }

  const unread = await prisma.coachNotification.count({ where: { userId: ctx.userId, readAt: null } });
  const groups = [
    ...(ctx.canCoach ? [{ title: "Coach", items: COACH_NAV }] : []),
    ...(ctx.isLeadership ? [{ title: "Leadership", items: LEADERSHIP_NAV }] : []),
  ];
  const header = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="eyebrow">Coach Dashboard</p>
        <p className="mt-2 truncate text-sm text-cream">{ctx.profile.displayName}</p>
      </div>
      <Link
        href="/coach/notifications"
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line-strong text-cream hover:border-gold"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-gold px-1.5 text-[0.65rem] font-semibold text-charcoal">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    </div>
  );

  return (
    <div className="container-page py-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:py-12">
      <aside>
        <div className="lg:hidden">
          {header}
          <details className="card mb-8">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-cream">Dashboard menu</summary>
            <div className="border-t border-line px-1 pt-4">
              <CoachNav groups={groups} />
            </div>
          </details>
        </div>
        <div className="sticky top-24 hidden lg:block">
          {header}
          <CoachNav groups={groups} />
        </div>
      </aside>
      <div className="min-w-0 space-y-8">{children}</div>
    </div>
  );
}
