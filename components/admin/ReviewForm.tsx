"use client";

import { useActionState } from "react";
import type { AdminFormState } from "@/app/actions/admin";
import { SUBMISSION_STATUSES } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  submissionId: string;
  status: string;
  score: number | null;
  feedback: string;
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
};

export function ReviewForm({ submissionId, status, score, feedback, action }: Props) {
  const [state, formAction] = useActionState(action, null);
  const prefix = `review-${submissionId}`;

  return (
    <form
      action={formAction}
      className="grid gap-4 sm:grid-cols-[1fr_8rem]"
    >
      <div>
        <label
          htmlFor={`${prefix}-status`}
          className="field-label"
        >
          Status
        </label>
        <select
          id={`${prefix}-status`}
          name="status"
          defaultValue={status}
          className="field-input"
        >
          {SUBMISSION_STATUSES.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor={`${prefix}-score`}
          className="field-label"
        >
          Score (0–100)
        </label>
        <input
          id={`${prefix}-score`}
          name="score"
          inputMode="numeric"
          defaultValue={score?.toString() ?? ""}
          className="field-input"
          aria-invalid={state?.errors?.score ? true : undefined}
        />
      </div>
      <div className="sm:col-span-2">
        <label
          htmlFor={`${prefix}-feedback`}
          className="field-label"
        >
          Feedback (visible only to this member)
        </label>
        <textarea
          id={`${prefix}-feedback`}
          name="feedback"
          rows={3}
          defaultValue={feedback}
          className="field-input"
        />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <SubmitButton
          className="btn btn-gold btn-sm"
          pendingLabel="Saving…"
        >
          Save review
        </SubmitButton>
        {state && (
          <p
            className={`text-sm ${state.ok ? "text-emerald-300" : "text-red-300"}`}
            role="status"
          >
            {state.ok ? state.message : (Object.values(state.errors ?? {})[0] ?? state.message)}
          </p>
        )}
      </div>
    </form>
  );
}
