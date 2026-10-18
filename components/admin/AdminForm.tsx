"use client";

import { useActionState } from "react";
import type { AdminFormState } from "@/app/actions/admin";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export type AdminField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "datetime" | "number" | "url" | "checkbox";
  defaultValue?: string | boolean;
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  rows?: number;
  half?: boolean;
  placeholder?: string;
};

type Props = {
  fields: AdminField[];
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  submitLabel: string;
};

export function AdminForm({ fields, action, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, null);
  const errors = state?.errors ?? {};

  return (
    <form
      action={formAction}
      className="grid gap-6 sm:grid-cols-2"
      noValidate
    >
      {fields.map((field) => {
        const error = errors[field.name];
        const describedBy = error ? `${field.name}-error` : field.hint ? `${field.name}-hint` : undefined;
        const common = {
          id: field.name,
          name: field.name,
          required: field.required,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
          className: "field-input",
          placeholder: field.placeholder,
        };

        if (field.type === "checkbox") {
          return (
            <div
              key={field.name}
              className="sm:col-span-2"
            >
              <label className="flex items-start gap-3 text-sm text-cream">
                <input
                  type="checkbox"
                  name={field.name}
                  defaultChecked={Boolean(field.defaultValue)}
                  className="mt-0.5 h-4 w-4 accent-[#d4af6b]"
                />
                <span>
                  {field.label}
                  {field.hint && <span className="mt-1 block text-xs text-slate">{field.hint}</span>}
                </span>
              </label>
            </div>
          );
        }

        return (
          <div
            key={field.name}
            className={field.half ? "" : "sm:col-span-2"}
          >
            <label
              htmlFor={field.name}
              className="field-label"
            >
              {field.label}
              {field.required && <span className="text-gold"> *</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                {...common}
                rows={field.rows ?? 5}
                defaultValue={String(field.defaultValue ?? "")}
              />
            ) : field.type === "select" ? (
              <select
                {...common}
                defaultValue={String(field.defaultValue ?? field.options?.[0]?.value ?? "")}
              >
                {field.options?.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                {...common}
                type={
                  field.type === "datetime" ? "datetime-local" : field.type === "number" ? "text" : field.type
                }
                inputMode={field.type === "number" ? "numeric" : undefined}
                defaultValue={String(field.defaultValue ?? "")}
              />
            )}
            {error ? (
              <p
                id={`${field.name}-error`}
                className="mt-1.5 text-sm text-red-300"
              >
                {error}
              </p>
            ) : (
              field.hint && (
                <p
                  id={`${field.name}-hint`}
                  className="mt-1.5 text-xs text-slate"
                >
                  {field.hint}
                </p>
              )
            )}
          </div>
        );
      })}

      {state && !state.ok && (
        <div className="sm:col-span-2">
          <Notice tone="error">{state.message}</Notice>
        </div>
      )}
      {state?.ok && (
        <div className="sm:col-span-2">
          <Notice tone="success">{state.message}</Notice>
        </div>
      )}

      <div className="border-t border-line pt-6 sm:col-span-2">
        <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
