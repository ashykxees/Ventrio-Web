import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Interaction,
  type ModalSubmitInteraction,
} from "discord.js";
import { prisma } from "@/lib/prisma";
import { getGuildId } from "@/lib/discord-bot";
import { getCoachRoleIds } from "@/lib/coach/roles";
import { hasAnyRole } from "@/lib/coach/rules";
import { refreshScheduleBoard } from "@/lib/coach/schedule-board";
import { getSiteUrl } from "@/lib/site";

// Feedback is accepted for a week after the call ends.
const FEEDBACK_WINDOW_MS = 7 * 86400000;

const COMMANDS = [
  { name: "startcall", description: "Coaches: start tracking a coaching call in your current voice channel" },
  { name: "endcall", description: "Coaches: end your call and send attendees a feedback request" },
];

const globalForGateway = globalThis as unknown as { ventrioGateway?: Client };

const ephemeral = (content: string) => ({ content, flags: MessageFlags.Ephemeral as const });

async function coachForInteraction(interaction: ChatInputCommandInteraction) {
  if (!interaction.inCachedGuild()) {
    return { error: "Use this command in the Ventrio server." } as const;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);

  if (!hasAnyRole([...member.roles.cache.keys()], getCoachRoleIds())) {
    return { error: "Only Ventrio coaches can use this command." } as const;
  }

  const coach = await prisma.coachProfile.findUnique({ where: { discordId: interaction.user.id } });

  if (!coach || coach.status !== "ACTIVE") {
    return { error: `Open the Coach Dashboard once first: ${getSiteUrl()}/coach` } as const;
  }

  return { member, coach } as const;
}

async function startCall(interaction: ChatInputCommandInteraction) {
  const found = await coachForInteraction(interaction);

  if ("error" in found) {
    return interaction.reply(ephemeral(found.error!));
  }

  const { member, coach } = found;
  const channel = member.voice.channel;

  if (!channel) {
    return interaction.reply(ephemeral("Join the voice channel for your call first, then run /startcall."));
  }

  const active = await prisma.coachCall.findFirst({
    where: { endedAt: null, OR: [{ coachId: coach.id }, { channelId: channel.id }] },
  });

  if (active) {
    return interaction.reply(
      ephemeral(active.coachId === coach.id ? "You already have a call running. Use /endcall first." : "Another call is already running in this channel."),
    );
  }

  // Link to the coach's scheduled session closest to now (within 3 hours), if any.
  const now = Date.now();
  const nearby = await prisma.coachSession.findMany({
    where: {
      coachId: coach.id,
      status: { not: "CANCELLED" },
      startAt: { gte: new Date(now - 3 * 3600000), lte: new Date(now + 3 * 3600000) },
    },
  });
  const session = nearby.sort((a, b) => Math.abs(a.startAt.getTime() - now) - Math.abs(b.startAt.getTime() - now))[0];
  const call = await prisma.coachCall.create({
    data: { coachId: coach.id, sessionId: session?.id, guildId: member.guild.id, channelId: channel.id },
  });
  const present = channel.members.filter((m) => !m.user.bot && m.id !== coach.discordId);

  for (const attendee of present.values()) {
    await prisma.callAttendee.create({ data: { callId: call.id, discordId: attendee.id } });
  }

  return interaction.reply(
    ephemeral(
      `Call started in <#${channel.id}>${session ? ` for "${session.title}"` : ""}. Everyone who joins is tracked. Run /endcall when you're done.`,
    ),
  );
}

async function endCall(interaction: ChatInputCommandInteraction) {
  const found = await coachForInteraction(interaction);

  if ("error" in found) {
    return interaction.reply(ephemeral(found.error!));
  }

  const call = await prisma.coachCall.findFirst({
    where: { coachId: found.coach.id, endedAt: null },
    include: { attendees: true, session: true },
  });

  if (!call) {
    return interaction.reply(ephemeral("You don't have a call running. Start one with /startcall."));
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  await prisma.coachCall.update({ where: { id: call.id }, data: { endedAt: new Date() } });

  const embed = new EmbedBuilder()
    .setColor(0xd4af6b)
    .setTitle("How was your coaching call?")
    .setDescription(
      `Thanks for joining ${call.session ? `**${call.session.title}** ` : ""}with <@${found.coach.discordId}>. Pick a rating from 1 to 5 stars, then leave a short comment. Your coach sees your feedback without your name.`,
    )
    .setFooter({ text: "Ventrio · Build Better Together." });
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    [1, 2, 3, 4, 5].map((stars) =>
      new ButtonBuilder()
        .setCustomId(`rate:${call.id}:${stars}`)
        .setLabel("★".repeat(stars))
        .setStyle(stars >= 4 ? ButtonStyle.Success : ButtonStyle.Secondary),
    ),
  );
  let sent = 0;
  let failed = 0;

  for (const attendee of call.attendees) {
    try {
      const user = await interaction.client.users.fetch(attendee.discordId);

      await user.send({ embeds: [embed], components: [row] });
      sent += 1;
    } catch {
      failed += 1;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  await prisma.coachCall.update({ where: { id: call.id }, data: { dmsSent: sent, dmsFailed: failed } });

  return interaction.editReply(
    `Call ended. ${call.attendees.length} attendee${call.attendees.length === 1 ? "" : "s"} tracked; feedback requests sent to ${sent}${failed ? ` (${failed} have DMs turned off)` : ""}.`,
  );
}

async function loadRatableCall(callId: string, discordId: string) {
  const call = await prisma.coachCall.findUnique({
    where: { id: callId },
    include: { attendees: { where: { discordId } }, feedback: { where: { discordId } } },
  });

  if (!call || call.attendees.length === 0 || !call.endedAt) {
    return { error: "This feedback request isn't valid." };
  }

  if (call.feedback.length > 0) {
    return { error: "You've already rated this call. Thank you!" };
  }

  if (Date.now() - call.endedAt.getTime() > FEEDBACK_WINDOW_MS) {
    return { error: "Feedback for this call has closed." };
  }

  return { call };
}

function parseRating(customId: string) {
  const [, callId, stars] = customId.split(":");
  const rating = Number(stars);

  return Number.isInteger(rating) && rating >= 1 && rating <= 5 && callId ? { callId, rating } : null;
}

async function ratingButton(interaction: ButtonInteraction) {
  const parsed = parseRating(interaction.customId);
  const check = parsed ? await loadRatableCall(parsed.callId, interaction.user.id) : { error: "Invalid rating." };

  if (!parsed || "error" in check) {
    return interaction.reply(ephemeral(check.error ?? "Invalid rating."));
  }

  const modal = new ModalBuilder()
    .setCustomId(`ratemodal:${parsed.callId}:${parsed.rating}`)
    .setTitle(`Your rating: ${"★".repeat(parsed.rating)}${"☆".repeat(5 - parsed.rating)}`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("comment")
          .setLabel("Comment (required)")
          .setPlaceholder("What went well? What could be better?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMinLength(3)
          .setMaxLength(1000),
      ),
    );

  return interaction.showModal(modal);
}

async function ratingModal(interaction: ModalSubmitInteraction) {
  const parsed = parseRating(interaction.customId);
  const comment = interaction.fields.getTextInputValue("comment").trim();
  const check = parsed ? await loadRatableCall(parsed.callId, interaction.user.id) : { error: "Invalid rating." };

  if (!parsed || "error" in check || comment.length < 3) {
    return interaction.reply(ephemeral(("error" in check && check.error) || "Please add a comment."));
  }

  await prisma.callFeedback.create({
    data: { callId: parsed.callId, discordId: interaction.user.id, rating: parsed.rating, comment: comment.slice(0, 1000) },
  });

  const thanks = `Thanks! You rated this call ${"★".repeat(parsed.rating)}${"☆".repeat(5 - parsed.rating)}.`;

  if (interaction.isFromMessage()) {
    return interaction.update({ content: thanks, embeds: [], components: [] });
  }

  return interaction.reply(ephemeral(thanks));
}

async function onInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "startcall") {
        await startCall(interaction);
      } else if (interaction.commandName === "endcall") {
        await endCall(interaction);
      }
    } else if (interaction.isButton() && interaction.customId.startsWith("rate:")) {
      await ratingButton(interaction);
    } else if (interaction.isModalSubmit() && interaction.customId.startsWith("ratemodal:")) {
      await ratingModal(interaction);
    }
  } catch (error) {
    console.error("[discord] Interaction failed", error);

    if (interaction.isRepliable()) {
      const message = "Something went wrong. Please try again.";

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message).catch(() => undefined);
      } else {
        await interaction.reply(ephemeral(message)).catch(() => undefined);
      }
    }
  }
}

export async function startGateway(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();

  if (!token || globalForGateway.ventrioGateway) {
    return;
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

  globalForGateway.ventrioGateway = client;

  client.once(Events.ClientReady, async (ready) => {
    console.log(`[discord] Gateway connected as ${ready.user.tag}`);

    const guildId = await getGuildId().catch(() => null);

    if (guildId) {
      await ready.application.commands
        .set(COMMANDS, guildId)
        .catch((error) => console.error("[discord] Slash command registration failed", error));
    }

    void refreshScheduleBoard();
    // Drops finished sessions from the schedule board over time.
    setInterval(() => void refreshScheduleBoard(), 30 * 60 * 1000);
  });

  client.on(Events.VoiceStateUpdate, async (_previous, state) => {
    if (!state.channelId || state.member?.user.bot) {
      return;
    }

    try {
      const call = await prisma.coachCall.findFirst({
        where: { channelId: state.channelId, endedAt: null },
        include: { coach: true },
      });

      if (call && call.coach.discordId !== state.id) {
        await prisma.callAttendee.upsert({
          where: { callId_discordId: { callId: call.id, discordId: state.id } },
          create: { callId: call.id, discordId: state.id },
          update: {},
        });
      }
    } catch (error) {
      console.error("[discord] Voice attendance error", error);
    }
  });

  client.on(Events.InteractionCreate, (interaction) => void onInteraction(interaction));
  client.on(Events.Error, (error) => console.error("[discord] Gateway error", error));

  await client.login(token);
}
