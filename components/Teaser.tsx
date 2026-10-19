import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import { VMark } from "@/components/Logo";
import { DiscordIcon, SignInWithDiscord, SignOutButton } from "@/components/AuthButtons";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { SubmitButton } from "@/components/SubmitButton";
import { setLaunchNotify } from "@/app/actions/launch";
import type { CurrentMember } from "@/lib/session";
import { getDiscordInviteUrl, isDiscordConfigured } from "@/lib/site";

export function Teaser({ member }: { member: CurrentMember | null }) {
  const invite = getDiscordInviteUrl();
  const profile = member?.profile;

  return (
    <section className="relative flex min-h-[calc(100vh-4.5rem)] items-center overflow-hidden">
      <VMark className="pointer-events-none absolute -right-24 -bottom-24 h-auto w-[34rem] text-gold opacity-[0.04]" />

      <div className="container-page relative flex flex-col items-center py-20 text-center">
        <VMark className="h-auto w-24 text-gold sm:w-28" />
        <p className="mt-8 font-display text-2xl font-semibold tracking-[0.5em] text-cream sm:text-3xl">
          VENTRIO
        </p>
        <p className="mt-4 font-display text-[0.65rem] font-medium tracking-[0.36em] text-gold uppercase">
          Ideas / Business / Faith / Impact
        </p>

        <p className="eyebrow mt-16">Coming soon</p>
        <h1 className="display mt-5 text-3xl tracking-[0.18em] text-cream sm:text-5xl">
          Build Better Together.
        </h1>
        <span className="gold-rule mx-auto mt-8" />
        <p className="mt-8 max-w-xl leading-relaxed text-slate sm:text-lg">
          A community for young entrepreneurs ages 13–19 to learn business, build ideas, compete, connect, and
          grow in faith. We&apos;re getting ready to launch.
        </p>

        <div className="mt-12 w-full max-w-md">
          {member && profile ? (
            <div className="card p-6 text-left sm:p-8">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  discordId={profile.discordId}
                  avatar={profile.discordAvatar}
                  size={52}
                />
                <div>
                  <p className="flex items-center gap-2 font-display font-semibold text-cream">
                    <Check className="h-4 w-4 text-gold" />
                    You&apos;re on the list
                  </p>
                  <p className="text-sm text-slate">Signed in as @{profile.discordUsername}</p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-slate">
                {profile.joinedGuildAt
                  ? "You've been added to the Ventrio Discord server."
                  : "Join the Ventrio Discord server so you don't miss anything."}{" "}
                {profile.notifyOnLaunch
                  ? "Our bot will DM you the moment the website launches."
                  : "Launch DMs are turned off."}
              </p>

              <a
                href={invite}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold mt-6 w-full"
              >
                <DiscordIcon />
                Open the Ventrio Discord
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <form action={setLaunchNotify.bind(null, !profile.notifyOnLaunch)}>
                  <SubmitButton
                    className="text-xs text-slate underline-offset-4 hover:text-cream hover:underline"
                    pendingLabel="Saving…"
                  >
                    {profile.notifyOnLaunch ? "Don't DM me at launch" : "DM me when Ventrio launches"}
                  </SubmitButton>
                </form>
                <SignOutButton className="text-xs text-slate underline-offset-4 hover:text-cream hover:underline" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {isDiscordConfigured() ? (
                <SignInWithDiscord
                  callbackUrl="/"
                  className="btn btn-gold w-full"
                  label="Sign in with Discord"
                />
              ) : (
                <p className="text-sm text-slate">Sign-in opens soon.</p>
              )}
              <a
                href={invite}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline w-full"
              >
                Join the Discord server
              </a>
              <p className="mt-3 text-xs leading-relaxed text-slate">
                Signing in adds you to the Ventrio Discord server, and we&apos;ll DM you when the website
                launches. We only see your Discord username and avatar.{" "}
                <Link
                  href="/privacy"
                  className="text-cream hover:text-gold"
                >
                  Privacy
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function TeaserFooter() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate sm:flex-row">
        <p>© {new Date().getFullYear()} Ventrio</p>
        <nav
          className="flex gap-5"
          aria-label="Legal"
        >
          <Link
            href="/privacy"
            className="hover:text-cream"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-cream"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="hover:text-cream"
          >
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
