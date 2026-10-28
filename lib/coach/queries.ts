import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/coach/activity";
import type { CoachContext } from "@/lib/coach/access";

// Announcements a coach may see: published, live, and addressed to everyone or their coach role.
export async function getVisibleAnnouncements(ctx: CoachContext) {
  const now = new Date();
  const announcements = await prisma.coachAnnouncement.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      audience: { in: ["", ctx.coach?.coachRole ?? ""] },
    },
    include: { reads: { where: { userId: ctx.userId } } },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
  });

  // Scheduled announcements notify coaches the first time they become visible (deduplicated).
  for (const announcement of announcements) {
    if (announcement.reads.length === 0) {
      await notify(ctx.userId, {
        type: "ANNOUNCEMENT",
        title: `${announcement.important ? "Important: " : ""}${announcement.title}`,
        href: "/coach/announcements",
        dedupeKey: `announcement:${announcement.id}`,
      });
    }
  }

  return announcements;
}

// Published policies that need this user's acknowledgment of the current version.
export async function getPolicyStatus(userId: string) {
  const policies = await prisma.policy.findMany({
    where: { status: "PUBLISHED", currentVersion: { gt: 0 } },
    include: { versions: { include: { acks: { where: { userId } } }, orderBy: { version: "desc" } } },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return policies.map((policy) => {
    const current = policy.versions.find((version) => version.version === policy.currentVersion) ?? null;
    const acknowledged = Boolean(current?.acks.length);

    return { policy, current, acknowledged, needsAck: policy.requiresAck && !acknowledged };
  });
}

export function sumCents(records: { amountCents: number }[]): number {
  return records.reduce((total, record) => total + record.amountCents, 0);
}
