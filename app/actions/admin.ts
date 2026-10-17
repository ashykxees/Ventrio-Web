"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";
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
  SUBMISSION_STATUSES,
  TIMEZONES,
  valuesOf,
} from "@/lib/constants";
import { submissionFieldsFromText } from "@/lib/content";
import { zonedLocalToUtc } from "@/lib/dates";

export type AdminFormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
} | null;

class NotAuthorizedError extends Error {}

// Every admin mutation re-checks the server-side admin allowlist.
async function assertAdmin() {
  const member = await getCurrentMember();

  if (!member?.isAdmin) {
    throw new NotAuthorizedError("Not authorized");
  }

  return member;
}

const text = (max: number, min = 0, label = "This field") =>
  z
    .string()
    .trim()
    .min(min, min > 0 ? `${label} needs at least ${min} characters.` : undefined)
    .max(max, `Keep this under ${max} characters.`);

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value === "" || /^https:\/\/\S+$/i.test(value),
    "Use a full link starting with https://",
  );

const optionalInt = (min: number, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+$/.test(value) && Number(value) >= min && Number(value) <= max),
      `Enter a whole number from ${min} to ${max}.`,
    )
    .transform((value) => (value === "" ? null : Number(value)));

const localDate = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value),
    "Enter a valid date and time.",
  );

const timezone = z.enum(valuesOf(TIMEZONES));

function formErrors(error: z.ZodError): AdminFormState {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    errors[key] ??= issue.message;
  }

  return { ok: false, message: "Please fix the highlighted fields.", errors };
}

function toDate(local: string, tz: string): Date | null {
  return local ? zonedLocalToUtc(local, tz) : null;
}

function revalidateSite() {
  revalidatePath("/", "layout");
}

// ---------- Events ----------

const eventSchema = z
  .object({
    title: text(120, 3, "Title"),
    description: text(5000, 10, "Description"),
    type: z.enum(valuesOf(EVENT_TYPES)),
    startsAt: localDate.refine((value) => value !== "", "Start time is required."),
    endsAt: localDate,
    timezone,
    format: z.enum(valuesOf(EVENT_FORMATS)),
    location: text(200),
    capacity: optionalInt(1, 100000),
    registrationMode: z.enum(valuesOf(REGISTRATION_MODES)),
    registrationUrl: httpsUrl,
    organizer: text(120),
    status: z.enum(valuesOf(EVENT_STATUSES)),
  })
  .superRefine((data, ctx) => {
    if (data.registrationMode === "EXTERNAL" && !data.registrationUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationUrl"],
        message: "Add the external registration link.",
      });
    }

    if (data.endsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after the start time." });
    }
  });

export async function saveEvent(
  id: string | null,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = eventSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return formErrors(parsed.error);
  }

  const { startsAt, endsAt, ...rest } = parsed.data;
  const data = {
    ...rest,
    startsAt: toDate(startsAt, rest.timezone)!,
    endsAt: toDate(endsAt, rest.timezone),
  };

  if (id) {
    await prisma.event.update({ where: { id }, data });
  } else {
    await prisma.event.create({ data });
  }

  revalidateSite();
  redirect("/admin/events?saved=1");
}

// ---------- Academy ----------

const lessonSchema = z
  .object({
    title: text(120, 3, "Title"),
    description: text(600, 10, "Description"),
    details: text(8000),
    instructor: text(120),
    type: z.enum(valuesOf(LESSON_TYPES)),
    category: z.enum(valuesOf(LESSON_CATEGORIES)),
    startsAt: localDate,
    endsAt: localDate,
    timezone,
    registrationStatus: z.enum(valuesOf(LESSON_REGISTRATION)),
    capacity: optionalInt(1, 100000),
    resourceUrl: httpsUrl,
    status: z.enum(valuesOf(CONTENT_STATUSES)),
  })
  .superRefine((data, ctx) => {
    if (data.endsAt && !data.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Add a start time or clear the end time.",
      });
    }

    if (data.endsAt && data.startsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after the start time." });
    }
  });

export async function saveLesson(
  id: string | null,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = lessonSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return formErrors(parsed.error);
  }

  const { startsAt, endsAt, ...rest } = parsed.data;
  const data = {
    ...rest,
    startsAt: toDate(startsAt, rest.timezone),
    endsAt: toDate(endsAt, rest.timezone),
  };

  if (id) {
    await prisma.lesson.update({ where: { id }, data });
  } else {
    await prisma.lesson.create({ data });
  }

  revalidateSite();
  redirect("/admin/academy?saved=1");
}

// ---------- Competitions ----------

const competitionSchema = z
  .object({
    title: text(120, 3, "Title"),
    summary: text(300, 10, "Summary"),
    description: text(8000),
    eligibility: text(4000),
    requirements: text(4000),
    judgingCriteria: text(4000),
    prizes: text(2000),
    opensAt: localDate,
    deadline: localDate,
    timezone,
    phase: z.enum(valuesOf(COMPETITION_PHASES)),
    status: z.enum(valuesOf(CONTENT_STATUSES)),
    submissionFields: text(3000),
  })
  .superRefine((data, ctx) => {
    if (data.opensAt && data.deadline && data.deadline <= data.opensAt) {
      ctx.addIssue({
        code: "custom",
        path: ["deadline"],
        message: "Deadline must be after the opening time.",
      });
    }

    if (data.phase === "OPEN" && submissionFieldsFromText(data.submissionFields).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["submissionFields"],
        message: "Add at least one submission field before opening.",
      });
    }
  });

export async function saveCompetition(
  id: string | null,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = competitionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return formErrors(parsed.error);
  }

  const { opensAt, deadline, submissionFields, ...rest } = parsed.data;
  const data = {
    ...rest,
    prizesVerified: formData.get("prizesVerified") === "on",
    opensAt: toDate(opensAt, rest.timezone),
    deadline: toDate(deadline, rest.timezone),
    submissionFields: JSON.stringify(submissionFieldsFromText(submissionFields)),
  };

  if (id) {
    await prisma.competition.update({ where: { id }, data });
  } else {
    await prisma.competition.create({ data });
  }

  revalidateSite();
  redirect("/admin/competitions?saved=1");
}

const reviewSchema = z.object({
  status: z.enum(valuesOf(SUBMISSION_STATUSES)),
  score: optionalInt(0, 100),
  feedback: text(4000),
});

export async function reviewSubmission(
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return formErrors(parsed.error);
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath(`/admin/competitions/${submission.competitionId}/submissions`);
  revalidatePath(`/competitions/${submission.competitionId}`);

  return { ok: true, message: "Review saved." };
}

// ---------- Announcements ----------

const announcementSchema = z.object({
  title: text(120, 3, "Title"),
  body: text(4000, 10, "Message"),
  status: z.enum(valuesOf(CONTENT_STATUSES)),
});

export async function saveAnnouncement(
  id: string | null,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return formErrors(parsed.error);
  }

  const existing = id ? await prisma.announcement.findUnique({ where: { id } }) : null;
  const publishedAt =
    parsed.data.status === "PUBLISHED"
      ? (existing?.publishedAt ?? new Date())
      : (existing?.publishedAt ?? null);
  const data = { ...parsed.data, publishedAt };

  if (id) {
    await prisma.announcement.update({ where: { id }, data });
  } else {
    await prisma.announcement.create({ data });
  }

  revalidateSite();
  redirect("/admin/announcements?saved=1");
}

// ---------- Delete ----------

const DELETE_TARGETS = {
  event: { path: "/admin/events", remove: (id: string) => prisma.event.delete({ where: { id } }) },
  lesson: { path: "/admin/academy", remove: (id: string) => prisma.lesson.delete({ where: { id } }) },
  competition: {
    path: "/admin/competitions",
    remove: (id: string) => prisma.competition.delete({ where: { id } }),
  },
  announcement: {
    path: "/admin/announcements",
    remove: (id: string) => prisma.announcement.delete({ where: { id } }),
  },
};

export async function deleteContent(kind: keyof typeof DELETE_TARGETS, id: string): Promise<void> {
  await assertAdmin();

  const target = DELETE_TARGETS[kind];

  await target.remove(id);
  revalidateSite();
  redirect(`${target.path}?deleted=1`);
}
