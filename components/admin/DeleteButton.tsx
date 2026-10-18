"use client";

import { SubmitButton } from "@/components/SubmitButton";

export function DeleteButton({ action, label = "Delete" }: { action: () => Promise<void>; label?: string }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Delete this permanently? This can't be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <SubmitButton
        className="btn btn-danger btn-sm"
        pendingLabel="Deleting…"
      >
        {label}
      </SubmitButton>
    </form>
  );
}
