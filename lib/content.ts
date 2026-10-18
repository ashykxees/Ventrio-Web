import type { Competition, Event, Lesson } from "@prisma/client";
import type { BadgeTone } from "@/components/ui";

export type SubmissionField = {
  key: string;
  label: string;
  type: "short" | "long" | "url";
  required: boolean;
};

export function parseSubmissionFields(raw: string): SubmissionField[] {
  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as SubmissionField[]) : [];
  } catch {
    return [];
  }
}

// Admin-friendly format: one field per line, "Label | short|long|url | required".
export function submissionFieldsFromText(text: string): SubmissionField[] {
  const used = new Set<string>();

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 15)
    .map((line) => {
      const [label, type = "short", required = ""] = line.split("|").map((part) => part.trim());
      let key =
        label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "") || "field";

      while (used.has(key)) {
        key = `${key}_2`;
      }

      used.add(key);

      return {
        key,
        label: label.slice(0, 120),
        type: (["short", "long", "url"].includes(type.toLowerCase())
          ? type.toLowerCase()
          : "short") as SubmissionField["type"],
        required: required.toLowerCase().startsWith("req"),
      };
    });
}

export function submissionFieldsToText(fields: SubmissionField[]): string {
  return fields
    .map((field) => `${field.label} | ${field.type} | ${field.required ? "required" : "optional"}`)
    .join("\n");
}

export type EventTiming = "upcoming" | "live" | "past" | "cancelled";

export function eventTiming(
  event: Pick<Event, "startsAt" | "endsAt" | "status">,
  now = new Date(),
): EventTiming {
  if (event.status === "CANCELLED") {
    return "cancelled";
  }

  const end = event.endsAt ?? new Date(event.startsAt.getTime() + 60 * 60 * 1000);

  if (end < now) {
    return "past";
  }

  if (event.startsAt <= now) {
    return "live";
  }

  return "upcoming";
}

export const TIMING_BADGE: Record<EventTiming, { label: string; tone: BadgeTone }> = {
  upcoming: { label: "Upcoming", tone: "gold" },
  live: { label: "Happening now", tone: "green" },
  past: { label: "Past", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export const PHASE_TONE: Record<string, BadgeTone> = {
  UPCOMING: "neutral",
  OPEN: "green",
  IN_REVIEW: "blue",
  COMPLETED: "gold",
};

export const SUBMISSION_TONE: Record<string, BadgeTone> = {
  SUBMITTED: "neutral",
  IN_REVIEW: "blue",
  FINALIST: "gold",
  WINNER: "gold",
  NOT_SELECTED: "neutral",
  WITHDRAWN: "red",
};

export function competitionAcceptsSubmissions(
  competition: Pick<Competition, "phase" | "deadline" | "opensAt">,
  now = new Date(),
): boolean {
  if (competition.phase !== "OPEN") {
    return false;
  }

  if (competition.opensAt && competition.opensAt > now) {
    return false;
  }

  return !competition.deadline || competition.deadline > now;
}

export function lessonAcceptsRegistration(lesson: Pick<Lesson, "registrationStatus">): boolean {
  return lesson.registrationStatus === "OPEN";
}
