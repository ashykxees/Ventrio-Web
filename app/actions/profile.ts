"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";

export type ProfileState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
} | null;

const httpsUrl = z
  .string()
  .trim()
  .max(200, "Keep links under 200 characters.")
  .refine(
    (value) => value === "" || /^https:\/\/[^\s]+\.[^\s]+$/i.test(value),
    "Use a full link starting with https://",
  );

const listField = (label: string) =>
  z
    .string()
    .trim()
    .max(300, `Keep ${label} under 300 characters.`)
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 10)
        .join(", "),
    );

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name needs at least 2 characters.")
    .max(50, "Keep it under 50 characters."),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Handle needs at least 3 characters.")
    .max(24, "Keep your handle under 24 characters.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only."),
  bio: z.string().trim().max(280, "Keep your bio under 280 characters."),
  projectName: z.string().trim().max(80, "Keep the project name under 80 characters."),
  interests: listField("interests"),
  skills: listField("skills"),
  website: httpsUrl,
  socialOne: httpsUrl,
  socialTwo: httpsUrl,
  socialThree: httpsUrl,
});

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const member = await getCurrentMember();

  if (!member) {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const errors: Record<string, string> = {};

    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      errors[key] ??= issue.message;
    }

    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const { socialOne, socialTwo, socialThree, ...data } = parsed.data;
  const taken = await prisma.profile.findFirst({
    where: { handle: data.handle, NOT: { userId: member.userId } },
  });

  if (taken) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: { handle: "That handle is already taken." },
    };
  }

  await prisma.profile.update({
    where: { userId: member.userId },
    data: {
      ...data,
      socialLinks: [socialOne, socialTwo, socialThree].filter(Boolean).join("\n"),
    },
  });

  revalidatePath("/", "layout");

  return { ok: true, message: "Profile saved." };
}

const PRIVACY_FIELDS = [
  "isPublic",
  "showAvatar",
  "showBio",
  "showProjectName",
  "showInterests",
  "showSkills",
  "showLinks",
] as const;

export async function updatePrivacy(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const member = await getCurrentMember();

  if (!member) {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }

  const data = Object.fromEntries(PRIVACY_FIELDS.map((field) => [field, formData.get(field) === "on"]));

  await prisma.profile.update({
    where: { userId: member.userId },
    data,
  });

  revalidatePath("/", "layout");

  return { ok: true, message: "Privacy settings saved." };
}

export async function deleteAccount(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const member = await getCurrentMember();

  if (!member) {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }

  if (
    String(formData.get("confirm") ?? "")
      .trim()
      .toUpperCase() !== "DELETE"
  ) {
    return { ok: false, message: "Type DELETE to confirm." };
  }

  // Cascades to profile, sessions, accounts, registrations and submissions.
  await prisma.user.delete({ where: { id: member.userId } });
  await signOut({ redirectTo: "/" });

  return null;
}
