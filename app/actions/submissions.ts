"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";
import { competitionAcceptsSubmissions, parseSubmissionFields } from "@/lib/content";

export type SubmissionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function submitEntry(
  competitionId: string,
  _prev: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const member = await getCurrentMember();

  if (!member) {
    return { ok: false, message: "Please sign in to submit." };
  }

  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });

  if (!competition || competition.status !== "PUBLISHED" || !competitionAcceptsSubmissions(competition)) {
    return { ok: false, message: "This competition isn't accepting submissions right now." };
  }

  const existing = await prisma.submission.findUnique({
    where: { competitionId_userId: { competitionId, userId: member.userId } },
  });

  if (existing && !["SUBMITTED", "WITHDRAWN"].includes(existing.status)) {
    return { ok: false, message: "Your submission is already being reviewed and can no longer be edited." };
  }

  const fields = parseSubmissionFields(competition.submissionFields);
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = String(formData.get(field.key) ?? "").trim();
    const max = field.type === "long" ? 4000 : 300;

    values[field.key] = value;

    if (field.required && !value) {
      errors[field.key] = `${field.label} is required.`;
    } else if (value.length > max) {
      errors[field.key] = `Keep this under ${max} characters.`;
    } else if (field.type === "url" && value && !/^https:\/\/\S+$/i.test(value)) {
      errors[field.key] = "Enter a full link starting with https://";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors, values };
  }

  await prisma.submission.upsert({
    where: { competitionId_userId: { competitionId, userId: member.userId } },
    create: {
      competitionId,
      userId: member.userId,
      answers: JSON.stringify(values),
    },
    update: {
      answers: JSON.stringify(values),
      status: "SUBMITTED",
    },
  });

  revalidatePath(`/competitions/${competitionId}`);

  return {
    ok: true,
    message: existing ? "Your submission has been updated." : "Your submission has been received. Good luck!",
    values,
  };
}

export async function withdrawEntry(competitionId: string): Promise<void> {
  const member = await getCurrentMember();

  if (!member) {
    return;
  }

  await prisma.submission.updateMany({
    where: { competitionId, userId: member.userId, status: "SUBMITTED" },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath(`/competitions/${competitionId}`);
}
