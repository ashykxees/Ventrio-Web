import type { Metadata } from "next";
import Link from "next/link";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Badge } from "@/components/ui";
import { updateProfile } from "@/app/actions/profile";
import { discordAvatarUrl } from "@/lib/members";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function ProfilePage() {
  const { profile, isAdmin } = await requireMember("/profile");

  return (
    <section className="container-page py-12 sm:py-16">
      <div className="flex flex-col gap-6 border-b border-line pb-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <ProfileAvatar
            discordId={profile.discordId}
            avatar={profile.discordAvatar}
            size={72}
          />
          <div>
            <p className="eyebrow">My profile</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-cream">{profile.displayName}</h1>
            <p className="mt-1 text-sm text-slate">Signed in as @{profile.discordUsername} on Discord</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={profile.isPublic ? "green" : "neutral"}>
            {profile.isPublic ? "Public" : "Private"}
          </Badge>
          {isAdmin && <Badge tone="gold">Admin</Badge>}
          {profile.isPublic && (
            <Link
              href={`/members/${profile.handle}`}
              className="btn btn-outline btn-sm"
            >
              View public profile
            </Link>
          )}
          <Link
            href="/settings"
            className="btn btn-outline btn-sm"
          >
            Privacy settings
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <ProfileEditor
          profile={profile}
          avatarUrl={discordAvatarUrl(profile.discordId, profile.discordAvatar)}
          action={updateProfile}
        />
      </div>
    </section>
  );
}
