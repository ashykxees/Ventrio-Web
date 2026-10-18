import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { syncDiscordProfile, type DiscordProfile } from "@/lib/members";
import { addMemberToGuild } from "@/lib/discord-bot";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Database sessions: the browser only holds an HTTP-only session cookie.
  session: {
    strategy: "database",
  },
  trustHost: true,
  providers: [
    Discord({
      // Discord now returns an `iss` param on the OAuth callback; without a matching
      // issuer Auth.js falls back to "https://authjs.dev" and rejects the sign-in.
      issuer: "https://discord.com",
      // "identify" for the profile, "guilds.join" so we can add the member to the Ventrio server.
      // No email, server list or messages are requested.
      authorization: {
        params: {
          scope: "identify guilds.join",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "discord" || !user.id || !profile) {
        return;
      }

      const discord = profile as unknown as DiscordProfile;

      await syncDiscordProfile(user.id, discord);

      if (account.access_token) {
        await addMemberToGuild(user.id, discord.id, account.access_token).catch((error) =>
          console.error("[discord] Server auto-join error", error),
        );
      }
    },
  },
});
