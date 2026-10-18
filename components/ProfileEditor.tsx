"use client";

import { useActionState, useRef, useState } from "react";
import type { Profile } from "@prisma/client";
import type { ProfileState } from "@/app/actions/profile";
import { Badge, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  profile: Profile;
  avatarUrl: string;
  action: (prev: ProfileState, formData: FormData) => Promise<ProfileState>;
};

type Values = {
  displayName: string;
  handle: string;
  bio: string;
  projectName: string;
  interests: string;
  skills: string;
  website: string;
  socialOne: string;
  socialTwo: string;
  socialThree: string;
};

function initialValues(profile: Profile): Values {
  const links = profile.socialLinks.split("\n").filter(Boolean);

  return {
    displayName: profile.displayName,
    handle: profile.handle,
    bio: profile.bio,
    projectName: profile.projectName,
    interests: profile.interests,
    skills: profile.skills,
    website: profile.website,
    socialOne: links[0] ?? "",
    socialTwo: links[1] ?? "",
    socialThree: links[2] ?? "",
  };
}

function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="field-label"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${name}-error`}
          className="mt-1.5 text-sm text-red-300"
        >
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate">{hint}</p>
      )}
    </div>
  );
}

export function ProfileEditor({ profile, avatarUrl, action }: Props) {
  const [state, formAction] = useActionState(action, null);
  const [values, setValues] = useState<Values>(() => initialValues(profile));
  const formRef = useRef<HTMLFormElement>(null);
  const saved = initialValues(profile);
  const dirty = (Object.keys(values) as (keyof Values)[]).some((key) => values[key] !== saved[key]);
  const errors = state?.errors ?? {};

  const input = (name: keyof Values) => ({
    id: name,
    name,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [name]: event.target.value })),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    className: "field-input",
  });

  const tags = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <form
        ref={formRef}
        action={formAction}
        className="space-y-6"
        noValidate
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            name="displayName"
            label="Display name"
            error={errors.displayName}
          >
            <input
              {...input("displayName")}
              maxLength={50}
              required
              autoComplete="nickname"
            />
          </Field>
          <Field
            name="handle"
            label="Profile handle"
            hint={`ventrio.com/members/${values.handle || "your-handle"}`}
            error={errors.handle}
          >
            <input
              {...input("handle")}
              maxLength={24}
              required
              autoCapitalize="none"
              autoComplete="off"
            />
          </Field>
        </div>

        <Field
          name="bio"
          label="Short bio"
          hint={`${values.bio.length}/280`}
          error={errors.bio}
        >
          <textarea
            {...input("bio")}
            rows={4}
            maxLength={280}
            placeholder="What are you building? What do you want to learn?"
          />
        </Field>

        <Field
          name="projectName"
          label="Business or project name"
          error={errors.projectName}
        >
          <input
            {...input("projectName")}
            maxLength={80}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            name="interests"
            label="Interests"
            hint="Separate with commas, e.g. Marketing, Design"
            error={errors.interests}
          >
            <input
              {...input("interests")}
              maxLength={300}
            />
          </Field>
          <Field
            name="skills"
            label="Skills"
            hint="Separate with commas, e.g. Video editing, Sales"
            error={errors.skills}
          >
            <input
              {...input("skills")}
              maxLength={300}
            />
          </Field>
        </div>

        <fieldset className="space-y-4">
          <legend className="field-label">Website & social links (optional)</legend>
          {(["website", "socialOne", "socialTwo", "socialThree"] as const).map((name, index) => (
            <div key={name}>
              <label
                htmlFor={name}
                className="sr-only"
              >
                {index === 0 ? "Website" : `Social link ${index}`}
              </label>
              <input
                {...input(name)}
                type="url"
                inputMode="url"
                placeholder={index === 0 ? "https://your-website.com" : "https://"}
                maxLength={200}
              />
              {errors[name] && (
                <p
                  id={`${name}-error`}
                  className="mt-1.5 text-sm text-red-300"
                >
                  {errors[name]}
                </p>
              )}
            </div>
          ))}
        </fieldset>

        {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row">
          <SubmitButton
            className="btn btn-gold"
            pendingLabel="Saving…"
            disabled={!dirty}
          >
            Save profile
          </SubmitButton>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!dirty}
            onClick={() => setValues(saved)}
          >
            Cancel
          </button>
        </div>
      </form>

      <aside aria-label="Profile preview">
        <p className="eyebrow">Preview</p>
        <div className="card mt-4 p-6 lg:sticky lg:top-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt=""
            width={64}
            height={64}
            className="rounded-full border border-line-strong"
          />
          <p className="mt-4 font-display text-lg font-semibold text-cream">
            {values.displayName || "Your name"}
          </p>
          <p className="text-sm text-slate">@{values.handle || "handle"}</p>
          {values.projectName && <p className="mt-3 text-sm text-gold">{values.projectName}</p>}
          {values.bio && <p className="mt-3 text-sm leading-relaxed text-slate">{values.bio}</p>}
          {tags(values.interests).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags(values.interests).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
          {tags(values.skills).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags(values.skills).map((tag) => (
                <Badge
                  key={tag}
                  tone="gold"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-6 border-t border-line pt-4 text-xs text-slate">
            {profile.isPublic
              ? "Your profile is public. Only fields you allow in Settings are shown."
              : "Your profile is private. Only you can see it."}
          </p>
        </div>
      </aside>
    </div>
  );
}
