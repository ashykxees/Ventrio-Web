"use client";

import { useActionState } from "react";
import type { SubmissionState } from "@/app/actions/submissions";
import type { SubmissionField } from "@/lib/content";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  fields: SubmissionField[];
  initialValues: Record<string, string>;
  isUpdate: boolean;
  action: (prev: SubmissionState, formData: FormData) => Promise<SubmissionState>;
};

export function SubmissionForm({ fields, initialValues, isUpdate, action }: Props) {
  const [state, formAction] = useActionState(action, null);
  const values = state?.values ?? initialValues;

  return (
    <form
      action={formAction}
      className="space-y-6"
      noValidate
    >
      {fields.map((field) => {
        const id = `field-${field.key}`;
        const error = state?.errors?.[field.key];
        const common = {
          id,
          name: field.key,
          defaultValue: values[field.key] ?? "",
          required: field.required,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? `${id}-error` : undefined,
          className: "field-input",
        };

        return (
          <div key={field.key}>
            <label
              htmlFor={id}
              className="field-label"
            >
              {field.label}
              {field.required ? (
                <span className="text-gold"> *</span>
              ) : (
                <span className="text-slate"> (optional)</span>
              )}
            </label>
            {field.type === "long" ? (
              <textarea
                {...common}
                rows={6}
                maxLength={4000}
              />
            ) : (
              <input
                {...common}
                type={field.type === "url" ? "url" : "text"}
                inputMode={field.type === "url" ? "url" : undefined}
                placeholder={field.type === "url" ? "https://" : undefined}
                maxLength={300}
              />
            )}
            {error && (
              <p
                id={`${id}-error`}
                className="mt-1.5 text-sm text-red-300"
              >
                {error}
              </p>
            )}
          </div>
        );
      })}

      {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}

      <SubmitButton
        className="btn btn-gold w-full sm:w-auto"
        pendingLabel="Submitting…"
      >
        {isUpdate ? "Update submission" : "Submit entry"}
      </SubmitButton>
    </form>
  );
}
