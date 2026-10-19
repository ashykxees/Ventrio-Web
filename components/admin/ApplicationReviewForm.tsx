"use client";

import { useActionState } from "react";
import type { ApplicationState } from "@/app/actions/careers";
import { APPLICATION_STATUSES } from "@/lib/careers";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  status: string;
  adminNotes: string;
  action: (prev: ApplicationState, formData: FormData) => Promise<ApplicationState>;
};

export function ApplicationReviewForm({ status, adminNotes, action }: Props) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="status"
          className="field-label"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="field-input"
        >
          {APPLICATION_STATUSES.map((option) => (
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
          htmlFor="adminNotes"
          className="field-label"
        >
          Private notes
        </label>
        <textarea
          id="adminNotes"
          name="adminNotes"
          rows={5}
          defaultValue={adminNotes}
          className="field-input"
        />
      </div>
      <div className="flex items-center gap-4">
        <SubmitButton
          className="btn btn-gold btn-sm"
          pendingLabel="Saving…"
        >
          Save
        </SubmitButton>
        {state && (
          <p
            className={`text-sm ${state.ok ? "text-emerald-300" : "text-red-300"}`}
            role="status"
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
