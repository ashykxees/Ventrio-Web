import type { Announcement, Competition, Event, Lesson } from "@prisma/client";
import type { AdminField } from "@/components/admin/AdminForm";
import {
  COMPETITION_PHASES,
  CONTENT_STATUSES,
  EVENT_FORMATS,
  EVENT_STATUSES,
  EVENT_TYPES,
  LESSON_CATEGORIES,
  LESSON_REGISTRATION,
  LESSON_TYPES,
  REGISTRATION_MODES,
  TIMEZONES,
} from "@/lib/constants";
import { parseSubmissionFields, submissionFieldsToText } from "@/lib/content";
import { utcToZonedLocal } from "@/lib/dates";

const DEFAULT_TZ = "America/New_York";

export function eventFields(event: Event | null): AdminField[] {
  const tz = event?.timezone ?? DEFAULT_TZ;

  return [
    { name: "title", label: "Title", type: "text", required: true, defaultValue: event?.title },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
      rows: 6,
      defaultValue: event?.description,
    },
    {
      name: "type",
      label: "Event type",
      type: "select",
      options: EVENT_TYPES,
      defaultValue: event?.type,
      half: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: EVENT_STATUSES,
      defaultValue: event?.status ?? "DRAFT",
      half: true,
      hint: "Only Published and Cancelled events are visible.",
    },
    {
      name: "startsAt",
      label: "Starts",
      type: "datetime",
      required: true,
      defaultValue: utcToZonedLocal(event?.startsAt, tz),
      half: true,
    },
    {
      name: "endsAt",
      label: "Ends",
      type: "datetime",
      defaultValue: utcToZonedLocal(event?.endsAt, tz),
      half: true,
    },
    {
      name: "timezone",
      label: "Timezone",
      type: "select",
      options: TIMEZONES,
      defaultValue: tz,
      half: true,
      hint: "Start and end times are entered in this timezone.",
    },
    {
      name: "format",
      label: "Format",
      type: "select",
      options: EVENT_FORMATS,
      defaultValue: event?.format,
      half: true,
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      defaultValue: event?.location,
      placeholder: "Discord stage, Zoom, or venue address",
      half: true,
    },
    { name: "organizer", label: "Organizer", type: "text", defaultValue: event?.organizer, half: true },
    {
      name: "registrationMode",
      label: "Registration",
      type: "select",
      options: REGISTRATION_MODES,
      defaultValue: event?.registrationMode ?? "NONE",
      half: true,
    },
    {
      name: "capacity",
      label: "Capacity",
      type: "number",
      defaultValue: event?.capacity?.toString() ?? "",
      half: true,
      hint: "Leave blank for unlimited.",
    },
    {
      name: "registrationUrl",
      label: "External registration link",
      type: "url",
      defaultValue: event?.registrationUrl,
      placeholder: "https://",
      hint: "Required when registration is external.",
    },
  ];
}

export function lessonFields(lesson: Lesson | null): AdminField[] {
  const tz = lesson?.timezone ?? DEFAULT_TZ;

  return [
    { name: "title", label: "Title", type: "text", required: true, defaultValue: lesson?.title },
    {
      name: "description",
      label: "Short description",
      type: "textarea",
      required: true,
      rows: 3,
      defaultValue: lesson?.description,
      hint: "Shown on the Academy card (max 600 characters).",
    },
    {
      name: "details",
      label: "Details",
      type: "textarea",
      rows: 8,
      defaultValue: lesson?.details,
      hint: "Full lesson content, agenda or notes. Blank lines start new paragraphs.",
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      options: LESSON_TYPES,
      defaultValue: lesson?.type,
      half: true,
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: LESSON_CATEGORIES,
      defaultValue: lesson?.category,
      half: true,
    },
    { name: "instructor", label: "Instructor", type: "text", defaultValue: lesson?.instructor, half: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: CONTENT_STATUSES,
      defaultValue: lesson?.status ?? "DRAFT",
      half: true,
    },
    {
      name: "startsAt",
      label: "Starts (optional)",
      type: "datetime",
      defaultValue: utcToZonedLocal(lesson?.startsAt, tz),
      half: true,
    },
    {
      name: "endsAt",
      label: "Ends (optional)",
      type: "datetime",
      defaultValue: utcToZonedLocal(lesson?.endsAt, tz),
      half: true,
    },
    { name: "timezone", label: "Timezone", type: "select", options: TIMEZONES, defaultValue: tz, half: true },
    {
      name: "registrationStatus",
      label: "Registration",
      type: "select",
      options: LESSON_REGISTRATION,
      defaultValue: lesson?.registrationStatus ?? "NOT_REQUIRED",
      half: true,
    },
    {
      name: "capacity",
      label: "Capacity",
      type: "number",
      defaultValue: lesson?.capacity?.toString() ?? "",
      half: true,
      hint: "Leave blank for unlimited.",
    },
    {
      name: "resourceUrl",
      label: "Resource link",
      type: "url",
      defaultValue: lesson?.resourceUrl,
      placeholder: "https://",
      half: true,
      hint: "Slides, video or worksheet.",
    },
  ];
}

export function competitionFields(competition: Competition | null): AdminField[] {
  const tz = competition?.timezone ?? DEFAULT_TZ;

  return [
    { name: "title", label: "Title", type: "text", required: true, defaultValue: competition?.title },
    {
      name: "summary",
      label: "Summary",
      type: "textarea",
      required: true,
      rows: 2,
      defaultValue: competition?.summary,
    },
    {
      name: "description",
      label: "How it works",
      type: "textarea",
      rows: 5,
      defaultValue: competition?.description,
    },
    {
      name: "phase",
      label: "Phase",
      type: "select",
      options: COMPETITION_PHASES,
      defaultValue: competition?.phase ?? "UPCOMING",
      half: true,
      hint: "Submissions are accepted only while Open.",
    },
    {
      name: "status",
      label: "Visibility",
      type: "select",
      options: CONTENT_STATUSES,
      defaultValue: competition?.status ?? "DRAFT",
      half: true,
    },
    {
      name: "opensAt",
      label: "Opens",
      type: "datetime",
      defaultValue: utcToZonedLocal(competition?.opensAt, tz),
      half: true,
    },
    {
      name: "deadline",
      label: "Deadline",
      type: "datetime",
      defaultValue: utcToZonedLocal(competition?.deadline, tz),
      half: true,
    },
    { name: "timezone", label: "Timezone", type: "select", options: TIMEZONES, defaultValue: tz, half: true },
    {
      name: "eligibility",
      label: "Eligibility",
      type: "textarea",
      rows: 3,
      defaultValue: competition?.eligibility,
    },
    {
      name: "requirements",
      label: "Submission requirements",
      type: "textarea",
      rows: 4,
      defaultValue: competition?.requirements,
    },
    {
      name: "judgingCriteria",
      label: "Judging criteria",
      type: "textarea",
      rows: 4,
      defaultValue: competition?.judgingCriteria,
    },
    {
      name: "prizes",
      label: "Prizes",
      type: "textarea",
      rows: 3,
      defaultValue: competition?.prizes,
      hint: "Hidden from the public until verified below.",
    },
    {
      name: "prizesVerified",
      label: "Prizes are confirmed and verified",
      type: "checkbox",
      defaultValue: competition?.prizesVerified ?? false,
      hint: "Only check this once the prizes are secured.",
    },
    {
      name: "submissionFields",
      label: "Submission form fields",
      type: "textarea",
      rows: 6,
      defaultValue: competition
        ? submissionFieldsToText(parseSubmissionFields(competition.submissionFields))
        : "Business name | short | required\nPitch summary | long | required\nPitch deck or video link | url | optional",
      hint: "One field per line: Label | short, long or url | required or optional",
    },
  ];
}

export function announcementFields(announcement: Announcement | null): AdminField[] {
  return [
    { name: "title", label: "Title", type: "text", required: true, defaultValue: announcement?.title },
    {
      name: "body",
      label: "Message",
      type: "textarea",
      required: true,
      rows: 6,
      defaultValue: announcement?.body,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: CONTENT_STATUSES,
      defaultValue: announcement?.status ?? "DRAFT",
      half: true,
    },
  ];
}
