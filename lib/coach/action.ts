import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

export type ActionState = { ok: boolean; message: string } | null;

// Thrown inside actions for expected, user-facing failures.
export class ActionError extends Error {}

export async function runAction(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await fn();

    return { ok: true, message: message || "Saved." };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof ActionError) {
      return { ok: false, message: error.message };
    }

    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const field = issue?.path.join(".");

      return { ok: false, message: field ? `${field}: ${issue.message}` : (issue?.message ?? "Invalid input.") };
    }

    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { ok: false, message: "That record already exists, so nothing was changed." };
    }

    console.error("[coach] Action failed", error);

    return { ok: false, message: "Something went wrong and your change was not saved. Please try again." };
  }
}

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) {
      values[key] = value;
    }
  }

  return values;
}

export const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
export const required = (max: number) => text(max).min(1, "This field is required.");

export const links = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) =>
      value
        .split(/\s+/)
        .filter(Boolean)
        .every((link) => /^https:\/\/\S+$/i.test(link)),
    "Use full links starting with https://, separated by spaces or new lines.",
  );

export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https:\/\/\S+$/i.test(value), "Use a full link starting with https://.");

export const timezone = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "Choose a valid time zone.");
