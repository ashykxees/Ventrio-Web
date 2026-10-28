import { saveSession } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Checkbox, Field, Hidden, Select, TextArea } from "@/components/coach/fields";
import type { CoachConfig } from "@/lib/coach/config";
import { TIMEZONES } from "@/lib/constants";
import { utcToZonedLocal } from "@/lib/dates";

type SessionValues = {
  id: string;
  title: string;
  sessionType: string;
  topic: string;
  objectives: string;
  audience: string;
  startAt: Date;
  durationMinutes: number;
  timezone: string;
  platform: string;
  meetingUrl: string;
  prepNotes: string;
  resources: string;
  notesForLeadership: string;
  weekKey: string | null;
};

export function SessionForm({
  config,
  timezone,
  session,
  hasWeeklyCall,
}: {
  config: CoachConfig;
  timezone: string;
  session?: SessionValues;
  hasWeeklyCall?: boolean;
}) {
  const tz = session?.timezone ?? timezone;

  return (
    <ActionForm
      action={saveSession}
      submitLabel={session ? "Save changes" : "Schedule session"}
      resetOnSuccess={!session}
    >
      {session && (
        <Hidden
          name="id"
          value={session.id}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Session title"
          name="title"
          required
          maxLength={120}
          defaultValue={session?.title}
        />
        <Select
          label="Session type"
          name="sessionType"
          required
          options={config.sessionTypes}
          defaultValue={session?.sessionType ?? config.sessionTypes[0]}
        />
        <Field
          label="Topic"
          name="topic"
          required
          maxLength={200}
          defaultValue={session?.topic}
        />
        <Field
          label="Intended audience"
          name="audience"
          maxLength={300}
          defaultValue={session?.audience}
          placeholder="e.g. Members ages 13–15, beginners"
        />
        <Field
          label="Date and start time"
          name="start"
          type="datetime-local"
          required
          defaultValue={session ? utcToZonedLocal(session.startAt, tz) : undefined}
        />
        <Select
          label="Time zone"
          name="timezone"
          required
          options={TIMEZONES}
          defaultValue={tz}
        />
        {config.sessionDurations.length > 0 ? (
          <Select
            label="Expected duration"
            name="durationMinutes"
            required
            options={config.sessionDurations.map((value) => ({ value, label: `${value} minutes` }))}
            defaultValue={session ? String(session.durationMinutes) : config.sessionDurations[0]}
          />
        ) : (
          <Field
            label="Expected duration (minutes)"
            name="durationMinutes"
            type="number"
            min={15}
            max={480}
            required
            defaultValue={session?.durationMinutes ?? 60}
          />
        )}
        {config.meetingPlatforms.length > 0 ? (
          <Select
            label="Meeting platform"
            name="platform"
            required
            options={config.meetingPlatforms}
            defaultValue={session?.platform ?? config.meetingPlatforms[0]}
          />
        ) : (
          <Field
            label="Meeting platform"
            name="platform"
            required
            maxLength={60}
            defaultValue={session?.platform}
            placeholder="e.g. Discord stage"
          />
        )}
        <Field
          label="Meeting link"
          name="meetingUrl"
          type="url"
          className="sm:col-span-2"
          defaultValue={session?.meetingUrl}
          hint="Optional. Leave blank if access instructions are shared another way."
        />
      </div>
      <TextArea
        label="Learning objectives"
        name="objectives"
        rows={3}
        maxLength={2000}
        defaultValue={session?.objectives}
      />
      <TextArea
        label="Preparation notes"
        name="prepNotes"
        rows={3}
        maxLength={3000}
        defaultValue={session?.prepNotes}
      />
      <TextArea
        label="Resources or lesson materials"
        name="resources"
        rows={2}
        maxLength={3000}
        defaultValue={session?.resources}
      />
      <TextArea
        label="Notes for leadership"
        name="notesForLeadership"
        rows={2}
        maxLength={2000}
        defaultValue={session?.notesForLeadership}
      />
      <Checkbox
        name="countsForWeek"
        label="This is my weekly coaching call"
        defaultChecked={session ? Boolean(session.weekKey) : !hasWeeklyCall}
      />
    </ActionForm>
  );
}
