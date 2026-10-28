import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Badge } from "@/components/ui";
import { splitList } from "@/lib/members";
import { prisma } from "@/lib/prisma";
import { getCoachRoleIds } from "@/lib/coach/access";
import { hasAnyRole, splitIds } from "@/lib/coach/rules";

// Only public profiles are returned, and only the fields the member opted to show.
async function getPublicProfile(handle: string) {
  const profile = await prisma.profile.findUnique({ where: { handle: handle.toLowerCase() } });

  if (!profile || !profile.isPublic) {
    return null;
  }

  // Coach badge: an active coach profile that still held a coach role at the last check.
  const coach = await prisma.coachProfile.findUnique({ where: { userId: profile.userId } });
  const isCoach = Boolean(
    coach && coach.status === "ACTIVE" && hasAnyRole(splitIds(coach.discordRoles), getCoachRoleIds()),
  );

  return {
    isCoach,
    coachRole: isCoach ? coach?.coachRole || "Ventrio Coach" : "",
    displayName: profile.displayName,
    handle: profile.handle,
    avatar: profile.showAvatar ? { discordId: profile.discordId, hash: profile.discordAvatar } : null,
    bio: profile.showBio ? profile.bio : "",
    projectName: profile.showProjectName ? profile.projectName : "",
    interests: profile.showInterests ? splitList(profile.interests) : [],
    skills: profile.showSkills ? splitList(profile.skills) : [],
    links: profile.showLinks ? [profile.website, ...profile.socialLinks.split("\n")].filter(Boolean) : [],
  };
}

export async function generateMetadata(props: PageProps<"/members/[handle]">): Promise<Metadata> {
  const { handle } = await props.params;
  const profile = await getPublicProfile(handle);

  return { title: profile?.displayName ?? "Member" };
}

export default async function MemberPage(props: PageProps<"/members/[handle]">) {
  const { handle } = await props.params;
  const profile = await getPublicProfile(handle);

  if (!profile) {
    notFound();
  }

  return (
    <section className="container-page max-w-3xl py-16 sm:py-24">
      <div className="card p-8 sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {profile.avatar ? (
            <ProfileAvatar
              discordId={profile.avatar.discordId}
              avatar={profile.avatar.hash}
              size={88}
            />
          ) : (
            <div className="flex h-22 w-22 items-center justify-center rounded-full border border-line-strong font-display text-2xl text-gold">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="eyebrow">Ventrio member</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-cream">{profile.displayName}</h1>
            {profile.isCoach && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 font-display text-[0.65rem] font-semibold tracking-[0.18em] text-gold uppercase">
                <BadgeCheck className="h-3.5 w-3.5" />
                {profile.coachRole}
              </p>
            )}
            <p className="text-sm text-slate">@{profile.handle}</p>
          </div>
        </div>

        {profile.projectName && (
          <div className="mt-8 border-t border-line pt-6">
            <p className="text-xs tracking-wide text-slate uppercase">Building</p>
            <p className="mt-1 font-display text-lg text-gold">{profile.projectName}</p>
          </div>
        )}
        {profile.bio && <p className="mt-6 leading-relaxed text-slate">{profile.bio}</p>}

        {profile.interests.length > 0 && (
          <div className="mt-8">
            <p className="text-xs tracking-wide text-slate uppercase">Interests</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.interests.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        )}
        {profile.skills.length > 0 && (
          <div className="mt-6">
            <p className="text-xs tracking-wide text-slate uppercase">Skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((tag) => (
                <Badge
                  key={tag}
                  tone="gold"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {profile.links.length > 0 && (
          <ul className="mt-8 space-y-2 border-t border-line pt-6">
            {profile.links.map((link) => (
              <li key={link}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-2 text-sm text-cream hover:text-gold"
                >
                  {link.replace(/^https:\/\//, "")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
