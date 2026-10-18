export const site = {
  name: "Ventrio",
  tagline: "Build Better Together.",
  supportingLine: "Faith × Business × Impact",
  description:
    "A community for the next generation of entrepreneurs to learn business, build ideas, compete, connect, and grow in faith.",
};

export const DEFAULT_DISCORD_INVITE = "https://discord.gg/J5y9A8Asch";

export function getDiscordInviteUrl(): string {
  return process.env.DISCORD_INVITE_URL?.trim() || DEFAULT_DISCORD_INVITE;
}

// Until SITE_LAUNCHED=true, visitors only see the teaser page (admins see everything).
export function isSiteLaunched(): boolean {
  return process.env.SITE_LAUNCHED?.trim().toLowerCase() === "true";
}

export function getSiteUrl(): string {
  return (process.env.AUTH_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
}

export function getContactEmail(): string | null {
  const email = process.env.CONTACT_EMAIL?.trim();
  return email ? email : null;
}

export function isDiscordConfigured(): boolean {
  return Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET);
}

export function getAdminDiscordIds(): string[] {
  return (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}
