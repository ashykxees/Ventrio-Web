// Pure coach-dashboard rules (no framework imports) so they can be unit tested with `node --test`.

// ISO-8601 week ("2026-W42") of the calendar day `date` falls on in `timeZone`.
export function isoWeekKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const day = new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
  const weekday = day.getUTCDay() || 7;

  day.setUTCDate(day.getUTCDate() + 4 - weekday);

  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${day.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Monday 00:00 UTC of an ISO week key, used to label weeks.
export function weekStartUtc(weekKey: string): Date {
  const [year, week] = weekKey.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);

  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);

  return monday;
}

export function periodKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

// "$24.50" / "24" -> 2450 cents; rejects negatives, more than 2 decimals and absurd values.
export function parseMoneyToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, "");

  if (!/^\d{1,6}(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }

  return Math.round(Number(cleaned) * 100);
}

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

// Allowed status moves. Coaches and leadership get different tables so a coach can never
// approve, reject or otherwise decide their own records.
export const REQUEST_COACH_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED: ["WITHDRAWN"],
  UNDER_REVIEW: ["WITHDRAWN"],
  MORE_INFO: ["SUBMITTED", "WITHDRAWN"],
};

export const REQUEST_LEADERSHIP_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "MORE_INFO", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["MORE_INFO", "APPROVED", "REJECTED"],
  MORE_INFO: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
};

export const TASK_COACH_TRANSITIONS: Record<string, string[]> = {
  NOT_STARTED: ["IN_PROGRESS", "SUBMITTED"],
  IN_PROGRESS: ["NOT_STARTED", "SUBMITTED"],
  REVISION: ["IN_PROGRESS", "SUBMITTED"],
};

export const TASK_LEADERSHIP_TRANSITIONS: Record<string, string[]> = {
  NOT_STARTED: ["CANCELLED", "COMPLETED"],
  IN_PROGRESS: ["CANCELLED", "COMPLETED"],
  SUBMITTED: ["REVISION", "COMPLETED", "CANCELLED"],
  REVISION: ["COMPLETED", "CANCELLED"],
};

export const SUBMISSION_LEADERSHIP_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REVISION", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["REVISION", "APPROVED", "REJECTED"],
  REVISION: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
};

export function canTransition(table: Record<string, string[]>, from: string, to: string): boolean {
  return table[from]?.includes(to) ?? false;
}

export function hasAnyRole(memberRoles: string[], allowed: string[]): boolean {
  return memberRoles.some((role) => allowed.includes(role));
}

export function splitIds(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter((id) => /^\d{5,25}$/.test(id));
}
