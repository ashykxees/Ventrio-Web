import { ProfileNav } from "@/components/profile/ProfileNav";
import { getCoachRoleIds } from "@/lib/coach/roles";
import { hasAnyRole, splitIds } from "@/lib/coach/rules";
import { prisma } from "@/lib/prisma";
import type { CurrentMember } from "@/lib/session";

// Sidebar layout shared by /profile/* and /settings. The coaching link uses the cached role check;
// the coaching page itself re-verifies roles with Discord.
export async function ProfileShell({ member, children }: { member: CurrentMember; children: React.ReactNode }) {
  const coach = await prisma.coachProfile.findUnique({ where: { userId: member.userId } });
  const isCoach = Boolean(
    coach && coach.status === "ACTIVE" && hasAnyRole(splitIds(coach.discordRoles), getCoachRoleIds()),
  );

  const groups = [
    {
      label: "Profile",
      items: [
        { href: "/profile", label: "Profile & socials" },
        ...(isCoach ? [{ href: "/profile/coaching", label: "Business & coaching" }] : []),
      ],
    },
    { label: "Business", items: [{ href: "/profile/products", label: "Apps & Products" }] },
    { label: "Account", items: [{ href: "/settings", label: "Privacy & account" }] },
  ];

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ProfileNav groups={groups} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-display text-[0.65rem] font-semibold tracking-[0.2em] text-slate uppercase">{eyebrow}</p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold text-cream">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm text-slate">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
