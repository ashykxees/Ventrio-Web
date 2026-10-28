"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import type { ActionState } from "@/lib/coach/action";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel?: string;
  // Extra submit buttons that send `intent=<value>` (e.g. save draft vs submit).
  intents?: { value: string; label: string; variant?: "gold" | "outline" | "danger"; confirm?: string }[];
  confirm?: string;
  resetOnSuccess?: boolean;
  variant?: "gold" | "outline" | "danger";
  className?: string;
};

const VARIANTS = {
  gold: "btn btn-gold btn-sm",
  outline: "btn btn-outline btn-sm",
  danger: "btn btn-danger btn-sm",
};

// Submits through onSubmit (not <form action>) so React never resets typed answers when the
// server rejects a change; the form only clears after a successful create when resetOnSuccess is set.
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  intents,
  confirm,
  resetOnSuccess = false,
  variant = "gold",
  className = "space-y-4",
}: Props) {
  const [state, dispatch, isPending] = useActionState(action, null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) {
      formRef.current?.reset();
    }
  }, [state, resetOnSuccess]);

  const buttons = intents ?? [{ value: "", label: submitLabel, variant, confirm }];

  return (
    <form
      ref={formRef}
      className={className}
      noValidate={false}
      onSubmit={(event) => {
        event.preventDefault();

        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const message = submitter?.dataset.confirm;

        if (message && !window.confirm(message)) {
          return;
        }

        const formData = new FormData(event.currentTarget, submitter);

        startTransition(() => dispatch(formData));
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {buttons.map((button) => (
          <button
            key={button.value || "submit"}
            type="submit"
            name={button.value ? "intent" : undefined}
            value={button.value || undefined}
            data-confirm={button.confirm}
            disabled={isPending}
            aria-busy={isPending}
            className={VARIANTS[button.variant ?? "gold"]}
          >
            {isPending ? "Saving…" : button.label}
          </button>
        ))}
        {state && !isPending && (
          <p
            className={`text-sm ${state.ok ? "text-emerald-300" : "text-red-300"}`}
            role={state.ok ? "status" : "alert"}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
