import { prisma } from "@/lib/prisma";
import { discordFetch } from "@/lib/discord-bot";

// One bot-owned embed in the coaching schedule channel, rebuilt whenever sessions change.
export function getScheduleChannelId(): string {
  return process.env.DISCORD_SCHEDULE_CHANNEL_ID?.trim() || "1560120142627733504";
}

const SETTING_KEY = "scheduleBoard";
// Bump when the board's look changes: the old message is deleted and a fresh one is posted once.
const BOARD_VERSION = 2;

async function buildEmbed() {
  const now = Date.now();
  const sessions = await prisma.coachSession.findMany({
    where: {
      status: { not: "CANCELLED" },
      hiddenFromBoard: false,
      startAt: { gte: new Date(now - 60 * 60 * 1000), lte: new Date(now + 14 * 86400000) },
    },
    include: { coach: { include: { user: { include: { profile: true } } } } },
    orderBy: { startAt: "asc" },
    take: 25,
  });

  const count = sessions.length;
  const workshopChannel = process.env.DISCORD_WORKSHOP_CHANNEL_ID?.trim();
  const description = [
    `There ${count === 1 ? "is" : "are"} currently **__${count}__** upcoming call${count === 1 ? "" : "s"}. ${
      count ? "Times are shown in your own time zone." : "Keep an eye out for future events."
    }`,
    ...(workshopChannel ? [`<#${workshopChannel}>`] : []),
  ].join("\n\n");

  return {
    title: "📅 Upcoming Coaching Calls:",
    color: 0xd4af6b,
    description,
    fields: sessions.map((session) => {
      const unix = Math.floor(session.startAt.getTime() / 1000);

      return {
        name: session.title.slice(0, 256),
        value: [
          `<t:${unix}:F> · <t:${unix}:R>`,
          `Coach: <@${session.coach.discordId}> · ${session.sessionType} · ${session.durationMinutes} min`,
          `Topic: ${session.topic}`,
          session.meetingUrl ? `Join: ${session.meetingUrl}` : `Where: ${session.platform}`,
        ]
          .join("\n")
          .slice(0, 1024),
      };
    }),
  };
}

async function refresh(): Promise<void> {
  if (!process.env.DISCORD_BOT_TOKEN?.trim()) {
    return;
  }

  const channelId = getScheduleChannelId();
  const body = JSON.stringify({ embeds: [await buildEmbed()], allowed_mentions: { parse: [] } });
  const row = await prisma.coachSetting.findUnique({ where: { key: SETTING_KEY } });
  const stored = row ? (JSON.parse(row.value) as { channelId?: string; messageId?: string; version?: number }) : {};

  if (stored.messageId && stored.version !== BOARD_VERSION) {
    await discordFetch(`/channels/${stored.channelId}/messages/${stored.messageId}`, { method: "DELETE" }).catch(() => undefined);
  } else if (stored.channelId === channelId && stored.messageId) {
    const response = await discordFetch(`/channels/${channelId}/messages/${stored.messageId}`, { method: "PATCH", body });

    if (response.ok) {
      return;
    }

    if (response.status !== 404) {
      console.error(`[discord] Schedule board update failed (${response.status}): ${await response.text()}`);
      return;
    }
  }

  const response = await discordFetch(`/channels/${channelId}/messages`, { method: "POST", body });

  if (!response.ok) {
    console.error(`[discord] Schedule board post failed (${response.status}): ${await response.text()}`);
    return;
  }

  const message = (await response.json()) as { id: string };
  const value = JSON.stringify({ channelId, messageId: message.id, version: BOARD_VERSION });

  await prisma.coachSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value, updatedById: "system" },
    update: { value, updatedById: "system" },
  });
}

let queue: Promise<void> = Promise.resolve();

// Serialized so two quick changes never post two boards. Never throws.
export function refreshScheduleBoard(): Promise<void> {
  queue = queue.then(() => refresh().catch((error) => console.error("[discord] Schedule board error", error)));

  return queue;
}
