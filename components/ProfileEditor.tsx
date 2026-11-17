"use client";

import { useActionState, useState } from "react";
import { Globe, Plus, X } from "lucide-react";
import type { Profile } from "@prisma/client";
import type { ProfileState } from "@/app/actions/profile";
import { Notice } from "@/components/ui";
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
  links: string[];
  visibility: "public" | "private";
};

const MAX_LINKS = 6;

function initialValues(profile: Profile): Values {
  return {
    displayName: profile.displayName,
    handle: profile.handle,
    bio: profile.bio,
    projectName: profile.projectName,
    interests: profile.interests,
    skills: profile.skills,
    links: [...new Set([profile.website, ...profile.socialLinks.split("\n")].filter(Boolean))],
    visibility: profile.isPublic ? "public" : "private",
  };
}

function linkLabel(link: string) {
  return link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
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
  const [draftLink, setDraftLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const saved = initialValues(profile);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const errors = state?.errors ?? {};

  const input = (name: Exclude<keyof Values, "links" | "visibility">) => ({
    id: name,
    name,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [name]: event.target.value })),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    className: "field-input",
  });

  const addLink = () => {
    let link = draftLink.trim();

    if (!link) {
      return;
    }

    if (!/^https?:\/\//i.test(link)) {
      link = `https://${link}`;
    }

    link = link.replace(/^http:\/\//i, "https://");

    if (!/^https:\/\/[^\s]+\.[^\s]+$/i.test(link) || link.length > 200) {
      setLinkError("That doesn't look like a link. Try something like instagram.com/yourname");
      return;
    }

    if (values.links.length >= MAX_LINKS) {
      setLinkError(`You can add up to ${MAX_LINKS} links.`);
      return;
    }

    setValues((current) => ({ ...current, links: [...new Set([...current.links, link])] }));
    setDraftLink("");
    setLinkError("");
  };

  return (
    <form
      action={formAction}
      className="card divide-y divide-line"
      noValidate
    >
      <input
        type="hidden"
        name="links"
        value={values.links.join("\n")}
      />

      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full border border-line-strong"
          />
          <div>
            <p className="text-sm font-medium text-cream">Photo from Discord</p>
            <p className="mt-0.5 text-xs text-slate">Change it on Discord. It updates the next time you sign in.</p>
          </div>
        </div>
        <div className="sm:text-right">
          <label
            htmlFor="visibility"
            className="sr-only"
          >
            Profile visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            value={values.visibility}
            onChange={(event) =>
              setValues((current) => ({ ...current, visibility: event.target.value as Values["visibility"] }))
            }
            className="field-input w-auto py-2 pr-8 text-sm"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <p className="mt-1.5 text-xs text-slate">
            {values.visibility === "public" ? "Anyone with your link can view it." : "Only you can see your profile."}
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-2">
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
          label="Handle"
          hint={`/members/${values.handle || "your-handle"} · lowercase letters, numbers and dashes`}
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
        <div className="sm:col-span-2">
          <Field
            name="bio"
            label="Bio"
            hint={`${values.bio.length}/280`}
            error={errors.bio}
          >
            <textarea
              {...input("bio")}
              rows={3}
              maxLength={280}
              placeholder="What are you building? What do you want to learn?"
            />
          </Field>
        </div>
        <Field
          name="projectName"
          label="Business or project"
          error={errors.projectName}
        >
          <input
            {...input("projectName")}
            maxLength={80}
          />
        </Field>
        <Field
          name="interests"
          label="Interests"
          hint="Comma-separated"
          error={errors.interests}
        >
          <input
            {...input("interests")}
            maxLength={300}
            placeholder="Marketing, Design"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            name="skills"
            label="Skills"
            hint="Comma-separated"
            error={errors.skills}
          >
            <input
              {...input("skills")}
              maxLength={300}
              placeholder="Video editing, Sales"
            />
          </Field>
        </div>
      </div>

      <div className="p-6">
        <p className="field-label">Socials & website</p>
        {values.links.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {values.links.map((link) => (
              <li
                key={link}
                className="inline-flex max-w-full items-center gap-2 rounded-md border border-line-strong bg-panel py-1.5 pr-1.5 pl-3 text-sm text-cream"
              >
                <Globe className="h-3.5 w-3.5 shrink-0 text-gold" />
                <span className="truncate">{linkLabel(link)}</span>
                <button
                  type="button"
                  onClick={() =>
                    setValues((current) => ({ ...current, links: current.links.filter((item) => item !== link) }))
                  }
                  className="rounded p-0.5 text-slate hover:bg-white/10 hover:text-cream"
                  aria-label={`Remove ${linkLabel(link)}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <label
            htmlFor="draftLink"
            className="sr-only"
          >
            Add a social or website link
          </label>
          <input
            id="draftLink"
            value={draftLink}
            onChange={(event) => setDraftLink(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addLink();
              }
            }}
            inputMode="url"
            placeholder="Paste a social or website link"
            className="field-input"
            disabled={values.links.length >= MAX_LINKS}
            aria-invalid={linkError || errors.links ? true : undefined}
          />
          <button
            type="button"
            onClick={addLink}
            disabled={!draftLink.trim() || values.links.length >= MAX_LINKS}
            className="btn btn-outline btn-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add link
          </button>
        </div>
        <p className={`mt-1.5 text-xs ${linkError || errors.links ? "text-red-300" : "text-slate"}`}>
          {linkError || errors.links || `Up to ${MAX_LINKS} links. Choose who sees them in Privacy & account.`}
        </p>
      </div>

      <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center">
        <SubmitButton
          className="btn btn-gold btn-sm"
          pendingLabel="Saving…"
          disabled={!dirty}
        >
          Save
        </SubmitButton>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={!dirty}
          onClick={() => {
            setValues(saved);
            setDraftLink("");
            setLinkError("");
          }}
        >
          Cancel
        </button>
        {state && (
          <div className="sm:ml-auto">
            <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>
          </div>
        )}
      </div>
    </form>
  );
}
