import Image from "next/image";
import { updateCoachProfile } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Field, Select, TextArea } from "@/components/coach/fields";
import { Detail, PageTitle, Panel, StatusBadge } from "@/components/coach/ui";
import { requireCoach } from "@/lib/coach/access";
import { TIMEZONES } from "@/lib/constants";
import { discordAvatarUrl } from "@/lib/members";

export const metadata = { title: "Profile & Settings" };

export default async function CoachProfilePage() {
  const ctx = await requireCoach();
  const coach = ctx.coach;

  return (
    <>
      <PageTitle
        title="Profile & Settings"
        description="Your role, account status and start date are managed by leadership."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel title="Your coach profile">
          <ActionForm action={updateCoachProfile}>
            <Field
              label="Discord username"
              name="discordUsername"
              defaultValue={`@${ctx.profile.discordUsername}`}
              readOnly
              hint="Comes from your Discord sign-in."
            />
            <TextArea
              label="Bio"
              name="bio"
              defaultValue={coach.bio}
              maxLength={1500}
            />
            <Field
              label="Expertise"
              name="expertise"
              defaultValue={coach.expertise}
              maxLength={500}
              hint="e.g. Social media, branding, business planning"
            />
            <TextArea
              label="Availability or preferred scheduling times"
              name="availability"
              defaultValue={coach.availability}
              rows={3}
              maxLength={1000}
            />
            <Select
              label="Display time zone"
              name="timezone"
              defaultValue={coach.timezone}
              options={TIMEZONES}
              hint="Dates and times across the dashboard are shown in this time zone."
            />
          </ActionForm>
        </Panel>
        <Panel title="Account">
          <div className="flex items-center gap-3">
            <Image
              src={discordAvatarUrl(ctx.profile.discordId, ctx.profile.discordAvatar)}
              alt=""
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <p className="text-sm text-cream">{ctx.profile.displayName}</p>
              <p className="text-xs text-slate">@{ctx.profile.discordUsername}</p>
            </div>
          </div>
          <dl className="mt-6 space-y-4">
            <Detail label="Coach role">{coach.coachRole || "Not assigned yet"}</Detail>
            <Detail label="Status">
              <StatusBadge
                status={coach.status}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "DEACTIVATED", label: "Deactivated" },
                ]}
              />
            </Detail>
            <Detail label="Start date">{coach.startDate ? coach.startDate.toISOString().slice(0, 10) : "Not set"}</Detail>
            <Detail label="Responsibilities">{coach.responsibilities}</Detail>
            <Detail label="Notifications">In-app only. Email and Discord notifications aren&apos;t set up.</Detail>
          </dl>
        </Panel>
      </div>
    </>
  );
}
