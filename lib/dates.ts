// Timezone helpers built on Intl so no date library is required.

function offsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

// Converts a <input type="datetime-local"> value entered in `timeZone` to a UTC Date.
export function zonedLocalToUtc(local: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const firstOffset = offsetMs(new Date(guess), timeZone);
  let result = guess - firstOffset;
  const secondOffset = offsetMs(new Date(result), timeZone);

  if (secondOffset !== firstOffset) {
    result = guess - secondOffset;
  }

  return new Date(result);
}

// Formats a UTC Date as a datetime-local value in `timeZone` (for editing forms).
export function utcToZonedLocal(date: Date | null | undefined, timeZone: string): string {
  if (!date) {
    return "";
  }

  const shifted = new Date(date.getTime() + offsetMs(date, timeZone));

  return shifted.toISOString().slice(0, 16);
}

export function formatDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTime(date: Date, timeZone: string, withZone = false): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: withZone ? "short" : undefined,
  }).format(date);
}

export function formatDateTime(date: Date, timeZone: string): string {
  return `${formatDate(date, timeZone)} · ${formatTime(date, timeZone, true)}`;
}

export function formatRange(start: Date, end: Date | null | undefined, timeZone: string): string {
  if (!end) {
    return formatDateTime(start, timeZone);
  }

  const sameDay = formatDate(start, timeZone) === formatDate(end, timeZone);

  if (sameDay) {
    return `${formatDate(start, timeZone)} · ${formatTime(start, timeZone)} – ${formatTime(end, timeZone, true)}`;
  }

  return `${formatDateTime(start, timeZone)} – ${formatDateTime(end, timeZone)}`;
}

export function monthDay(date: Date, timeZone: string): { month: string; day: string } {
  return {
    month: new Intl.DateTimeFormat("en-US", { timeZone, month: "short" }).format(date),
    day: new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(date),
  };
}
