"use client";

import { useActionState } from "react";
import type { AdminFormState } from "@/app/actions/admin";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export function LaunchDmForm({
  action,
  disabled,
}: {
  action: () => Promise<AdminFormState>;
  disabled: boolean;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="space-y-4"
    >
      <SubmitButton
        className="btn btn-gold btn-sm"
        pendingLabel="Sending…"
        disabled={disabled}
      >
        Send pending launch DMs
      </SubmitButton>
      {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
    </form>
  );
}
