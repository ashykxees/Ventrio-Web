"use client";

import { useActionState } from "react";
import type { Profile } from "@prisma/client";
import type { ProfileState } from "@/app/actions/profile";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Action = (prev: ProfileState, formData: FormData) => Promise<ProfileState>;

const FIELD_TOGGLES = [
  { name: "showAvatar", label: "Discord avatar" },
  { name: "showBio", label: "Bio" },
  { name: "showProjectName", label: "Business / project name" },
  { name: "showInterests", label: "Interests" },
  { name: "showSkills", label: "Skills" },
  { name: "showLinks", label: "Website & social links" },
] as const;

function Toggle({
  name,
  label,
  defaultChecked,
  description,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 py-4">
      <span>
        <span className="block text-sm font-medium text-cream">{label}</span>
        {description && <span className="mt-1 block text-xs leading-relaxed text-slate">{description}</span>}
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border border-line-strong bg-panel transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4.5 after:w-4.5 after:rounded-full after:bg-slate after:transition-transform peer-checked:border-gold peer-checked:bg-gold/20 peer-checked:after:translate-x-5 peer-checked:after:bg-gold peer-focus-visible:outline-2 peer-focus-visible:outline-gold"
      />
    </label>
  );
}

export function PrivacyForm({ profile, action }: { profile: Profile; action: Action }) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <div className="divide-y divide-line">
        <Toggle
          name="isPublic"
          label="Make my profile public"
          description={`Anyone can view your profile at /members/${profile.handle}. Your Discord ID and account details are never shown.`}
          defaultChecked={profile.isPublic}
        />
      </div>
      <fieldset>
        <legend className="eyebrow">Fields shown on your public profile</legend>
        <div className="mt-2 divide-y divide-line">
          {FIELD_TOGGLES.map((toggle) => (
            <Toggle
              key={toggle.name}
              name={toggle.name}
              label={toggle.label}
              defaultChecked={profile[toggle.name]}
            />
          ))}
        </div>
      </fieldset>
      {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <SubmitButton pendingLabel="Saving…">Save privacy settings</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="confirm"
          className="field-label"
        >
          Type DELETE to confirm
        </label>
        <input
          id="confirm"
          name="confirm"
          className="field-input max-w-xs"
          autoComplete="off"
          required
        />
      </div>
      {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <SubmitButton
        className="btn btn-danger"
        pendingLabel="Deleting…"
      >
        Delete my account
      </SubmitButton>
    </form>
  );
}
