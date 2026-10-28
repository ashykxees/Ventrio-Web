import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";
import { fetchGuildMemberRoles } from "@/lib/discord-bot";
import { getAdminDiscordIds } from "@/lib/site";
import { hasAnyRole, splitIds } from "@/lib/coach/rules";
import { getCoachRoleIds, getLeadershipRoleIds } from "@/lib/coach/roles";

export { DEFAULT_COACH_ROLE_IDS, getCoachRoleIds, getLeadershipRoleIds } from "@/lib/coach/roles";

// Roles are re-read from Discord at most this often, so removing a role revokes access within minutes.
const ROLE_CACHE_MS = 5 * 60 * 1000;

export const getCoachContext = cache(async () => {
  const member = await getCurrentMember();

  if (!member) {
    return null;
  }

  let coach = await prisma.coachProfile.findUnique({ where: { userId: member.userId } });
  const cacheFresh =
    coach?.rolesCheckedAt && Date.now() - coach.rolesCheckedAt.getTime() < ROLE_CACHE_MS;
  const roles = cacheFresh && coach ? splitIds(coach.discordRoles) : await fetchGuildMemberRoles(member.profile.discordId);
  const hasCoachRole = roles ? hasAnyRole(roles, getCoachRoleIds()) : false;
  const isLeadership = member.isAdmin || (roles ? hasAnyRole(roles, getLeadershipRoleIds()) : false);

  if (roles && !cacheFresh && !hasCoachRole && !isLeadership) {
    console.warn(
      `[coach] No coach role for @${member.profile.discordUsername} (${member.profile.discordId}). ` +
        `Roles in server: [${roles.join(", ") || "none"}]. Coach roles: [${getCoachRoleIds().join(", ")}]`,
    );
  }

  if (roles && !cacheFresh) {
    const data = { discordRoles: roles.join(","), rolesCheckedAt: new Date() };

    if (coach) {
      coach = await prisma.coachProfile.update({ where: { id: coach.id }, data });
    } else if (hasCoachRole) {
      coach = await prisma.coachProfile.create({
        data: { ...data, userId: member.userId, discordId: member.profile.discordId },
      });
    }
  }

  return {
    ...member,
    coach,
    rolesVerified: roles !== null,
    hasCoachRole,
    canCoach: Boolean(hasCoachRole && coach?.status === "ACTIVE"),
    isLeadership,
    timezone: coach?.timezone ?? "America/New_York",
  };
});

export type CoachContext = NonNullable<Awaited<ReturnType<typeof getCoachContext>>>;
export type ActiveCoachContext = CoachContext & { coach: NonNullable<CoachContext["coach"]> };

export async function requireCoachContext(): Promise<CoachContext> {
  const ctx = await getCoachContext();

  if (!ctx) {
    redirect("/login?callbackUrl=%2Fcoach");
  }

  return ctx;
}

export async function requireCoach(): Promise<ActiveCoachContext> {
  const ctx = await requireCoachContext();

  if (!ctx.canCoach || !ctx.coach) {
    notFound();
  }

  return ctx as ActiveCoachContext;
}

export async function requireLeadership(): Promise<CoachContext> {
  const ctx = await requireCoachContext();

  if (!ctx.isLeadership) {
    notFound();
  }

  return ctx;
}

// User IDs of everyone with leadership access (admin allowlist + leadership Discord roles seen so far).
export async function getLeadershipUserIds(): Promise<string[]> {
  const adminIds = getAdminDiscordIds();
  const leadershipRoles = getLeadershipRoleIds();
  const [admins, coaches] = await Promise.all([
    prisma.profile.findMany({ where: { discordId: { in: adminIds } }, select: { userId: true } }),
    leadershipRoles.length > 0
      ? prisma.coachProfile.findMany({ select: { userId: true, discordRoles: true } })
      : Promise.resolve([]),
  ]);
  const fromRoles = coaches
    .filter((coach) => hasAnyRole(splitIds(coach.discordRoles), leadershipRoles))
    .map((coach) => coach.userId);

  return Array.from(new Set([...admins.map((admin) => admin.userId), ...fromRoles]));
}

// Active coaches who still held a coach role at their last check.
export async function getActiveCoaches() {
  const coachRoles = getCoachRoleIds();
  const coaches = await prisma.coachProfile.findMany({
    where: { status: "ACTIVE" },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });

  return coaches.filter((coach) => hasAnyRole(splitIds(coach.discordRoles), coachRoles));
}

export function coachName(coach: { user: { name: string | null; profile: { displayName: string } | null } }): string {
  return coach.user.profile?.displayName ?? coach.user.name ?? "Coach";
}

export async function userNames(userIds: (string | null | undefined)[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
  const profiles = await prisma.profile.findMany({
    where: { userId: { in: ids } },
    select: { userId: true, displayName: true },
  });

  return new Map(profiles.map((profile) => [profile.userId, profile.displayName]));
}
