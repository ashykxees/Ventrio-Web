import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { MobileNav } from "@/components/MobileNav";
import { DiscordIcon, SignOutButton } from "@/components/AuthButtons";
import { getCurrentMemberSafe } from "@/lib/session";
import { discordAvatarUrl } from "@/lib/members";

const NAV_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/academy", label: "Academy" },
  { href: "/events", label: "Events" },
  { href: "/competitions", label: "Competitions" },
  { href: "/community", label: "Community" },
];

export async function SiteHeader() {
  const member = await getCurrentMemberSafe();
  const profile = member?.profile;

  const accountLinks = member ? (
    <>
      <Link
        href="/profile"
        className="btn btn-outline"
      >
        My profile
      </Link>
      {member.isAdmin && (
        <Link
          href="/admin"
          className="btn btn-outline"
        >
          Admin
        </Link>
      )}
      <SignOutButton className="btn btn-ghost" />
    </>
  ) : (
    <Link
      href="/login"
      className="btn btn-gold w-full"
    >
      <DiscordIcon />
      Sign in with Discord
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-charcoal">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo />
        <NavLinks items={NAV_ITEMS} />

        <div className="hidden items-center gap-3 lg:flex">
          {member && profile ? (
            <>
              {member.isAdmin && (
                <Link
                  href="/admin"
                  className="font-display text-[0.7rem] font-semibold tracking-[0.24em] text-slate uppercase hover:text-gold"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-line-strong py-1 pr-4 pl-1 text-sm text-cream transition-colors hover:border-gold"
              >
                <Image
                  src={discordAvatarUrl(profile.discordId, profile.discordAvatar)}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full"
                />
                <span className="max-w-[9rem] truncate">{profile.displayName}</span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="btn btn-gold btn-sm"
            >
              <DiscordIcon />
              Sign in with Discord
            </Link>
          )}
        </div>

        <MobileNav items={NAV_ITEMS}>{accountLinks}</MobileNav>
      </div>
    </header>
  );
}
