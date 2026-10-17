"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";
import { eventTiming, lessonAcceptsRegistration } from "@/lib/content";

export type ActionState = {
  ok: boolean;
  message: string;
} | null;

async function confirmedCount(where: { eventId?: string; lessonId?: string }) {
  return prisma.registration.count({
    where: { ...where, status: "CONFIRMED" },
  });
}

export async function registerForEvent(eventId: string): Promise<ActionState> {
  const member = await getCurrentMember();

  if (!member) {
    return { ok: false, message: "Please sign in to register." };
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event || event.status !== "PUBLISHED" || event.registrationMode !== "SITE") {
    return { ok: false, message: "Registration isn't available for this event." };
  }

  if (eventTiming(event) !== "upcoming") {
    return { ok: false, message: "This event has already started or ended." };
  }

  const existing = await prisma.registration.findUnique({
    where: { userId_eventId: { userId: member.userId, eventId } },
  });

  if (existing?.status === "CONFIRMED") {
    return { ok: true, message: "You're already registered." };
  }

  if (event.capacity !== null && (await confirmedCount({ eventId })) >= event.capacity) {
    return { ok: false, message: "Sorry, this event is full." };
  }

  await prisma.registration.upsert({
    where: { userId_eventId: { userId: member.userId, eventId } },
    create: { userId: member.userId, eventId },
    update: { status: "CONFIRMED" },
  });

  revalidatePath(`/events/${eventId}`);

  return { ok: true, message: "You're registered! See you there." };
}

export async function cancelEventRegistration(eventId: string): Promise<ActionState> {
  const member = await getCurrentMember();

  if (!member) {
    return { ok: false, message: "Please sign in first." };
  }

  await prisma.registration.updateMany({
    where: { userId: member.userId, eventId },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/events/${eventId}`);

  return { ok: true, message: "Your registration has been cancelled." };
}

export async function registerForLesson(lessonId: string): Promise<ActionState> {
  const member = await getCurrentMember();

  if (!member) {
    return { ok: false, message: "Please sign in to register." };
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });

  if (!lesson || lesson.status !== "PUBLISHED" || !lessonAcceptsRegistration(lesson)) {
    return { ok: false, message: "Registration isn't open for this item." };
  }

  const existing = await prisma.registration.findUnique({
    where: { userId_lessonId: { userId: member.userId, lessonId } },
  });

  if (existing?.status === "CONFIRMED") {
    return { ok: true, message: "You're already registered." };
  }

  if (lesson.capacity !== null && (await confirmedCount({ lessonId })) >= lesson.capacity) {
    return { ok: false, message: "Sorry, this is full." };
  }

  await prisma.registration.upsert({
    where: { userId_lessonId: { userId: member.userId, lessonId } },
    create: { userId: member.userId, lessonId },
    update: { status: "CONFIRMED" },
  });

  revalidatePath(`/academy/${lessonId}`);

  return { ok: true, message: "You're registered!" };
}

export async function cancelLessonRegistration(lessonId: string): Promise<ActionState> {
  const member = await getCurrentMember();

  if (!member) {
    return { ok: false, message: "Please sign in first." };
  }

  await prisma.registration.updateMany({
    where: { userId: member.userId, lessonId },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/academy/${lessonId}`);

  return { ok: true, message: "Your registration has been cancelled." };
}
