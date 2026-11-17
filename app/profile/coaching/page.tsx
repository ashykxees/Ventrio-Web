import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { updateCoachingProfile } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Checkbox, Field, TextArea } from "@/components/coach/fields";
import { SectionTitle } from "@/components/profile/ProfileShell";
import { Badge } from "@/components/ui";
import { requireCoach } from "@/lib/coach/access";
import { splitList } from "@/lib/members";

export const metadata: Metadata = {
  title: "Business & coaching",
  robots: { index: false, follow: false },
};

// Coaches only: requireCoach re-checks the Discord coach role and 404s for everyone else.
export default async function CoachingProfilePage() {
  const { coach, profile } = await requireCoach();
  const expertise = splitList(coach.expertise);
  const skills = splitList(coach.skills);

  return (
    <>
      <SectionTitle
        eyebrow="Profile"
        title="Business & coaching"
        description="Show members what you're a professional in. This appears in a coaching section on your public profile."
        actions={
          <Link
            href="/coach"
            className="btn btn-outline btn-sm"
          >
            Coach Dashboard
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
        <div className="card p-6">
          <ActionForm
            action={updateCoachingProfile}
            className="space-y-5"
          >
            <Field
              label="Professional headline"
              name="headline"
              defaultValue={coach.headline}
              maxLength={100}
              placeholder="Brand strategist helping teen founders launch"
            />
            <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
              <Field
                label="Professional in"
                name="expertise"
                defaultValue={coach.expertise}
                maxLength={500}
                placeholder="Social media marketing, Branding"
                hint="Your areas of expertise, comma-separated."
              />
              <Field
                label="Years of experience"
                name="yearsExperience"
                type="number"
                min={0}
                max={60}
                defaultValue={coach.yearsExperience ?? ""}
              />
            </div>
            <Field
              label="Skills"
              name="skills"
              defaultValue={coach.skills}
              maxLength={500}
              placeholder="Content strategy, Canva, Pitch decks"
              hint="Comma-separated."
            />
            <TextArea
              label="What I can help you with"
              name="helpWith"
              defaultValue={coach.helpWith}
              rows={3}
              maxLength={1000}
            />
            <TextArea
              label="Credentials & experience"
              name="credentials"
              defaultValue={coach.credentials}
              rows={3}
              maxLength={1000}
              hint="Businesses you've built, roles, certifications or results."
            />
            <Checkbox
              label="Show this coaching section on my public profile"
              name="showCoachingOnProfile"
              defaultChecked={coach.showCoachingOnProfile}
            />
          </ActionForm>
        </div>

        <aside
          aria-label="Coaching preview"
          className="card h-fit p-5"
        >
          <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 font-display text-[0.6rem] font-semibold tracking-[0.18em] text-gold uppercase">
            <BadgeCheck className="h-3.5 w-3.5" />
            {coach.coachRole || "Ventrio Coach"}
          </p>
          <p className="mt-3 font-display text-base font-semibold text-cream">{profile.displayName}</p>
          {coach.headline && <p className="mt-1 text-sm text-slate">{coach.headline}</p>}
          {expertise.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {expertise.map((tag) => (
                <Badge
                  key={tag}
                  tone="gold"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
          <p className="mt-5 border-t border-line pt-3 text-xs text-slate">
            {!profile.isPublic
              ? "Your profile is private, so nobody sees this yet."
              : coach.showCoachingOnProfile
                ? "Shown on your public profile."
                : "Hidden from your public profile."}
          </p>
        </aside>
      </div>
    </>
  );
}
