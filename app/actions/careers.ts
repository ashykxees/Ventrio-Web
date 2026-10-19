"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";
import { AGREEMENTS, APPLICATION_STATUSES, COACH_POSITIONS } from "@/lib/careers";
import { valuesOf } from "@/lib/constants";
import { notifyNewCoachApplication } from "@/lib/discord-bot";

export type ApplicationState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
} | null;

const answer = z
  .string()
  .trim()
  .min(30, "Please write at least 30 characters.")
  .max(3000, "Keep this under 3,000 characters.");

const applicationSchema = z.object({
  email: z.string().trim().max(200).email("Enter a valid email address."),
  position: z.enum(valuesOf(COACH_POSITIONS), { message: "Choose a position." }),
  experience: answer,
  expertise: answer,
  practicalExample: answer,
  teachingPlan: answer,
  feedbackApproach: answer,
  availability: z
    .string()
    .trim()
    .min(5, "Tell us when you're usually available.")
    .max(1000, "Keep this under 1,000 characters."),
  motivation: answer,
  links: z
    .string()
    .trim()
    .max(500, "Keep links under 500 characters.")
    .refine(
      (value) =>
        value
          .split(/\s+/)
          .filter(Boolean)
          .every((link) => /^https:\/\/\S+$/i.test(link)),
      "Use full links starting with https://, separated by spaces or new lines.",
    ),
});

export async function submitCoachApplication(
  _prev: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  const member = await getCurrentMember();

  if (!member) {
    return { ok: false, message: "Please continue with Discord before submitting." };
  }

  const existing = await prisma.coachApplication.findUnique({ where: { userId: member.userId } });

  if (existing) {
    return { ok: false, message: "You've already submitted an application." };
  }

  const errors: Record<string, string> = {};

  for (const agreement of AGREEMENTS) {
    if (formData.get(agreement.name) !== "on") {
      errors[agreement.name] = "Please confirm to continue.";
    }
  }

  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors[String(issue.path[0])] ??= issue.message;
    }
  }

  if (!parsed.success || Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  // Discord identity always comes from the server session, never from submitted form fields.
  const application = await prisma.coachApplication.create({
    data: {
      ...parsed.data,
      userId: member.userId,
      discordId: member.profile.discordId,
      discordUsername: member.profile.discordUsername,
    },
  });

  await notifyNewCoachApplication(application).catch((error) =>
    console.error("[discord] Coach application notification failed", error),
  );

  revalidatePath("/careers");
  revalidatePath("/admin/applications");

  return { ok: true, message: "Application submitted." };
}

const reviewSchema = z.object({
  status: z.enum(valuesOf(APPLICATION_STATUSES)),
  adminNotes: z.string().trim().max(4000, "Keep notes under 4,000 characters."),
});

export async function reviewCoachApplication(
  id: string,
  _prev: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  const member = await getCurrentMember();

  if (!member?.isAdmin) {
    return { ok: false, message: "Not authorized." };
  }

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.coachApplication.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/careers");

  return { ok: true, message: "Saved." };
}
