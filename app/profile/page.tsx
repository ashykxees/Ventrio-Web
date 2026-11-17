import type { Metadata } from "next";
import Link from "next/link";
import { ProfileEditor } from "@/components/ProfileEditor";
import { SectionTitle } from "@/components/profile/ProfileShell";
import { updateProfile } from "@/app/actions/profile";
import { discordAvatarUrl } from "@/lib/members";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile & socials",
};

export default async function ProfilePage() {
  const { profile } = await requireMember("/profile");

  return (
    <>
      <SectionTitle
        eyebrow="Profile"
        title="Profile & socials"
        actions={
          profile.isPublic && (
            <Link
              href={`/members/${profile.handle}`}
              className="btn btn-outline btn-sm"
            >
              View public profile
            </Link>
          )
        }
      />
      <ProfileEditor
        profile={profile}
        avatarUrl={discordAvatarUrl(profile.discordId, profile.discordAvatar)}
        action={updateProfile}
      />
    </>
  );
}
