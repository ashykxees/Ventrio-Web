import { prisma } from "@/lib/prisma";
import { getDiscordInviteUrl, getSiteUrl } from "@/lib/site";

const API = "https://discord.com/api/v10";

function botToken(): string | null {
  return process.env.DISCORD_BOT_TOKEN?.trim() || null;
}

async function discordFetch(path: string, init: RequestInit = {}, attempt = 0): Promise<Response> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${botToken()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(8000),
  });

  if (response.status === 429 && attempt < 3) {
    const body = (await response.json().catch(() => ({}))) as { retry_after?: number };
    await new Promise((resolve) => setTimeout(resolve, Math.ceil((body.retry_after ?? 1) * 1000)));

    return discordFetch(path, init, attempt + 1);
  }

  return response;
}

let cachedGuildId: string | null = null;

// DISCORD_GUILD_ID wins; otherwise the server is looked up from the invite link.
export async function getGuildId(): Promise<string | null> {
  const configured = process.env.DISCORD_GUILD_ID?.trim();

  if (configured) {
    return configured;
  }

  if (cachedGuildId) {
    return cachedGuildId;
  }

  const code = getDiscordInviteUrl().split("/").pop()?.split("?")[0];

  if (!code) {
    return null;
  }

  const response = await fetch(`${API}/invites/${code}`, { signal: AbortSignal.timeout(8000) });
  const invite = (await response.json().catch(() => null)) as { guild?: { id?: string } } | null;

  cachedGuildId = invite?.guild?.id ?? null;

  return cachedGuildId;
}

// Adds the member to the Ventrio server using their OAuth token (requires the guilds.join scope
// and a bot from the same Discord application that is already in the server).
export async function addMemberToGuild(
  userId: string,
  discordId: string,
  accessToken: string,
): Promise<void> {
  if (!botToken()) {
    console.warn("[discord] DISCORD_BOT_TOKEN not set; skipping server auto-join");
    return;
  }

  const guildId = await getGuildId();

  if (!guildId) {
    console.warn("[discord] Could not resolve the Discord server ID; skipping server auto-join");
    return;
  }

  const response = await discordFetch(`/guilds/${guildId}/members/${discordId}`, {
    method: "PUT",
    body: JSON.stringify({ access_token: accessToken }),
  });

  // 201 = added, 204 = already a member.
  if (response.status === 201 || response.status === 204) {
    await prisma.profile.update({
      where: { userId },
      data: { joinedGuildAt: new Date() },
    });

    return;
  }

  console.error(`[discord] Server auto-join failed (${response.status}): ${await response.text()}`);
}

async function sendLaunchDm(discordId: string): Promise<string | null> {
  const channelResponse = await discordFetch("/users/@me/channels", {
    method: "POST",
    body: JSON.stringify({ recipient_id: discordId }),
  });

  if (!channelResponse.ok) {
    return `open DM failed (${channelResponse.status})`;
  }

  const channel = (await channelResponse.json()) as { id: string };
  const siteUrl = getSiteUrl();
  const messageResponse = await discordFetch(`/channels/${channel.id}/messages`, {
    method: "POST",
    body: JSON.stringify({
      embeds: [
        {
          title: "Ventrio is live.",
          description:
            "Thanks for joining the waitlist. The Ventrio website is officially open — explore the Academy, upcoming events and pitch competitions, and set up your member profile.\n\n**Build Better Together.**",
          url: siteUrl,
          color: 0xd4af6b,
          footer: { text: "Faith × Business × Impact" },
        },
      ],
      components: [
        {
          type: 1,
          components: [{ type: 2, style: 5, label: "Visit Ventrio", url: siteUrl }],
        },
      ],
    }),
  });

  return messageResponse.ok ? null : `send failed (${messageResponse.status})`;
}

let launchRunInProgress = false;

// Sends the launch DM once to every waitlisted member who hasn't received it yet.
export async function sendLaunchDms(): Promise<{ sent: number; failed: number; skipped: string | null }> {
  if (!botToken()) {
    return { sent: 0, failed: 0, skipped: "DISCORD_BOT_TOKEN is not set" };
  }

  if (launchRunInProgress) {
    return { sent: 0, failed: 0, skipped: "A launch DM run is already in progress" };
  }

  launchRunInProgress = true;

  let sent = 0;
  let failed = 0;

  try {
    const pending = await prisma.profile.findMany({
      where: { notifyOnLaunch: true, launchNotifiedAt: null },
      select: { id: true, discordId: true },
    });

    for (const profile of pending) {
      const error = await sendLaunchDm(profile.discordId).catch((err: Error) => err.message);

      // Mark as handled either way so nobody is DM'd twice; failures keep the reason for admins.
      await prisma.profile.update({
        where: { id: profile.id },
        data: { launchNotifiedAt: new Date(), launchNotifyError: error },
      });

      if (error) {
        failed += 1;
      } else {
        sent += 1;
      }

      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  } finally {
    launchRunInProgress = false;
  }

  console.log(`[discord] Launch DMs: ${sent} sent, ${failed} failed`);

  return { sent, failed, skipped: null };
}

// Optional: post new coach applications to a staff channel via a Discord webhook
// (DISCORD_APPLICATIONS_WEBHOOK_URL). No bot permissions are involved.
export async function notifyNewCoachApplication(application: {
  id: string;
  discordId: string;
  discordUsername: string;
  position: string;
}): Promise<void> {
  const webhookUrl = process.env.DISCORD_APPLICATIONS_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return;
  }

  const positions: Record<string, string> = {
    MARKETING: "Marketing Coach",
    STRATEGY: "Business Strategy Coach",
    BOTH: "Both positions",
  };
  const reviewUrl = `${getSiteUrl()}/admin/applications/${application.id}`;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      username: "Ventrio Careers",
      embeds: [
        {
          title: "New coach application",
          url: reviewUrl,
          color: 0xd4af6b,
          fields: [
            {
              name: "Applicant",
              value: `<@${application.discordId}> (@${application.discordUsername})`,
              inline: true,
            },
            {
              name: "Position",
              value: positions[application.position] ?? application.position,
              inline: true,
            },
            { name: "Review", value: reviewUrl },
          ],
        },
      ],
      allowed_mentions: { parse: [] },
    }),
  });

  if (!response.ok) {
    console.error(`[discord] Application webhook failed (${response.status}): ${await response.text()}`);
  }
}

// Role IDs the member currently holds in the Ventrio server, read with the bot token.
// [] = not in the server; null = couldn't check (no token, Discord error), so callers deny access.
let warnedNoToken = false;

export async function fetchGuildMemberRoles(discordId: string): Promise<string[] | null> {
  if (!botToken()) {
    if (!warnedNoToken) {
      warnedNoToken = true;
      console.warn("[discord] DISCORD_BOT_TOKEN not set; can't verify coach roles");
    }

    return null;
  }

  const guildId = await getGuildId().catch(() => null);

  if (!guildId) {
    return null;
  }

  const response = await discordFetch(`/guilds/${guildId}/members/${discordId}`).catch(() => null);

  if (!response) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    let code: number | undefined;

    try {
      code = (JSON.parse(text) as { code?: number }).code;
    } catch {
      code = undefined;
    }

    // 10007 = Unknown Member: the user isn't in the server. Anything else (e.g. 10004 Unknown Guild
    // when the bot isn't in the server) means we couldn't check, so access is denied with a log line.
    if (code === 10007) {
      console.warn(`[discord] Role check: user ${discordId} is not a member of server ${guildId}`);
      return [];
    }

    console.error(`[discord] Role check failed for server ${guildId} (${response.status}): ${text}`);
    return null;
  }

  const body = (await response.json()) as { roles?: string[] };

  return body.roles ?? [];
}
