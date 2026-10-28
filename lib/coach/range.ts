function monthStart(offset = 0) {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
}

// ?from=YYYY-MM-DD&to=YYYY-MM-DD, defaulting to the current calendar month (UTC).
export function parseRange(searchParams: Record<string, string | string[] | undefined>, defaultMonths = 1) {
  const valid = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const fromText = valid(searchParams.from) ? String(searchParams.from) : monthStart(1 - defaultMonths).toISOString().slice(0, 10);
  const toText = valid(searchParams.to) ? String(searchParams.to) : new Date(monthStart(1).getTime() - 86400000).toISOString().slice(0, 10);

  return {
    fromText,
    toText,
    from: new Date(`${fromText}T00:00:00Z`),
    to: new Date(`${toText}T23:59:59Z`),
  };
}
