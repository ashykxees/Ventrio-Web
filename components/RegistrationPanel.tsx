"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import type { ActionState } from "@/app/actions/registrations";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  registered: boolean;
  full: boolean;
  register: () => Promise<ActionState>;
  cancel: () => Promise<ActionState>;
};

export function RegistrationPanel({ registered, full, register, cancel }: Props) {
  const [registerState, registerAction] = useActionState(register, null);
  const [cancelState, cancelAction] = useActionState(cancel, null);
  const state = registered ? (registerState ?? cancelState) : (cancelState ?? registerState);

  return (
    <div className="space-y-4">
      {registered ? (
        <>
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <Check className="h-4 w-4" />
            You&apos;re registered
          </p>
          <form action={cancelAction}>
            <SubmitButton
              className="btn btn-outline w-full"
              pendingLabel="Cancelling…"
            >
              Cancel registration
            </SubmitButton>
          </form>
        </>
      ) : (
        <form action={registerAction}>
          <SubmitButton
            className="btn btn-gold w-full"
            pendingLabel="Registering…"
            disabled={full}
          >
            {full ? "Full" : "Register"}
          </SubmitButton>
        </form>
      )}
      {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
    </div>
  );
}
