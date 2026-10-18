import { prisma } from "@/lib/prisma";

export type DiscordProfile = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  discriminator?: string;
};

export function discordAvatarUrl(discordId: string, avatar: string | null | undefined): string {
  if (avatar) {
    const extension = avatar.startsWith("a_") ? "gif" : "png";

    return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=256`;
  }

  const index = Number((BigInt(discordId) >> BigInt(22)) % BigInt(6));

  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

async function uniqueHandle(base: string): Promise<string> {
  const root = slugify(base) || "member";
  let candidate = root;
  let attempt = 1;

  while (await prisma.profile.findUnique({ where: { handle: candidate } })) {
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }

  return candidate;
}

// Creates the member profile on first sign-in and refreshes Discord data afterwards.
export async function syncDiscordProfile(userId: string, discord: DiscordProfile) {
  const existing = await prisma.profile.findUnique({ where: { userId } });

  if (existing) {
    return prisma.profile.update({
      where: { userId },
      data: {
        discordUsername: discord.username,
        discordAvatar: discord.avatar ?? null,
      },
    });
  }

  return prisma.profile.create({
    data: {
      userId,
      discordId: discord.id,
      discordUsername: discord.username,
      discordAvatar: discord.avatar ?? null,
      displayName: (discord.global_name || discord.username).slice(0, 50),
      handle: await uniqueHandle(discord.username),
    },
  });
}

// Fallback for sessions created before a profile existed.
export async function ensureProfile(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });

  if (profile) {
    return profile;
  }

  const account = await prisma.account.findFirst({
    where: { userId, provider: "discord" },
  });
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!account || !user) {
    return null;
  }

  return syncDiscordProfile(userId, {
    id: account.providerAccountId,
    username: user.name ?? "member",
    avatar: null,
  });
}

export function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
