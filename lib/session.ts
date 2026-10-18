import { cache } from "react";
import { redirect, notFound, unstable_rethrow } from "next/navigation";
import { auth } from "@/auth";
import { ensureProfile } from "@/lib/members";
import { getAdminDiscordIds } from "@/lib/site";

// Resolves the signed-in member (user + profile + admin flag) on the server.
export const getCurrentMember = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const profile = await ensureProfile(userId);

  if (!profile) {
    return null;
  }

  // Admin access comes only from the server-side allowlist of Discord IDs.
  const isAdmin = getAdminDiscordIds().includes(profile.discordId);

  return {
    userId,
    profile,
    isAdmin,
  };
});

export type CurrentMember = NonNullable<Awaited<ReturnType<typeof getCurrentMember>>>;

export async function requireMember(callbackPath = "/profile"): Promise<CurrentMember> {
  const member = await getCurrentMember();

  if (!member) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  return member;
}

export async function requireAdmin(): Promise<CurrentMember> {
  const member = await requireMember("/admin");

  if (!member.isAdmin) {
    notFound();
  }

  return member;
}

// For UI that should still render if the database is unreachable (header, home page).
// Re-throws Next.js control-flow errors (redirects, dynamic rendering bailouts).
export async function getCurrentMemberSafe() {
  try {
    return await getCurrentMember();
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
