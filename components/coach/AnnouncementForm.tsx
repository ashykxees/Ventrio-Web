import { saveAnnouncement } from "@/app/actions/leadership";
import { ActionForm } from "@/components/coach/ActionForm";
import { Checkbox, Field, Hidden, Select, TextArea } from "@/components/coach/fields";
import { PUBLISH_STATUSES } from "@/lib/coach/constants";
import { TIMEZONES } from "@/lib/constants";
import { utcToZonedLocal } from "@/lib/dates";

type Announcement = {
  id: string;
  title: string;
  body: string;
  category: string;
  audience: string;
  status: string;
  important: boolean;
  pinned: boolean;
  publishAt: Date | null;
  expiresAt: Date | null;
};

export function AnnouncementForm({ roles, timezone, announcement }: { roles: string[]; timezone: string; announcement?: Announcement }) {
  return (
    <ActionForm
      action={saveAnnouncement}
      resetOnSuccess={!announcement}
    >
      {announcement && (
        <Hidden
          name="id"
          value={announcement.id}
        />
      )}
      <Field
        label="Title"
        name="title"
        required
        maxLength={150}
        defaultValue={announcement?.title}
      />
      <TextArea
        label="Body"
        name="body"
        required
        rows={6}
        maxLength={10000}
        defaultValue={announcement?.body}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Category"
          name="category"
          defaultValue={announcement?.category ?? "General"}
        />
        <Select
          label="Audience"
          name="audience"
          options={roles}
          placeholder="All active coaches"
          defaultValue={announcement?.audience}
        />
        <Select
          label="Status"
          name="status"
          options={PUBLISH_STATUSES}
          defaultValue={announcement?.status ?? "DRAFT"}
        />
        <Field
          label="Publish at (optional)"
          name="publishAt"
          type="datetime-local"
          defaultValue={utcToZonedLocal(announcement?.publishAt, timezone)}
          hint="Blank = immediately when published."
        />
        <Field
          label="Expires at (optional)"
          name="expiresAt"
          type="datetime-local"
          defaultValue={utcToZonedLocal(announcement?.expiresAt, timezone)}
        />
        <Select
          label="Time zone"
          name="timezone"
          options={TIMEZONES}
          defaultValue={timezone}
        />
      </div>
      <div className="flex flex-wrap gap-6">
        <Checkbox
          name="important"
          label="Mark as important"
          defaultChecked={announcement?.important}
        />
        <Checkbox
          name="pinned"
          label="Pin to top"
          defaultChecked={announcement?.pinned}
        />
      </div>
    </ActionForm>
  );
}
