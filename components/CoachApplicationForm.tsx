"use client";

import { useActionState, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { ApplicationState } from "@/app/actions/careers";
import {
  AGREEMENTS,
  COACH_POSITIONS,
  EXPERIENCE_QUESTIONS,
  TEACHING_QUESTIONS,
  type ApplicationQuestion,
} from "@/lib/careers";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  discordUsername: string;
  action: (prev: ApplicationState, formData: FormData) => Promise<ApplicationState>;
};

const STEPS = [
  { title: "Applicant information", fields: ["email", "position"] },
  { title: "Experience & skills", fields: EXPERIENCE_QUESTIONS.map((question) => question.name) },
  {
    title: "Teaching & agreements",
    fields: [
      ...TEACHING_QUESTIONS.map((question) => question.name),
      "links",
      ...AGREEMENTS.map((agreement) => agreement.name),
    ],
  },
];

function FieldError({ name, error }: { name: string; error?: string }) {
  if (!error) {
    return null;
  }

  return (
    <p
      id={`${name}-error`}
      className="mt-1.5 text-sm text-red-300"
    >
      {error}
    </p>
  );
}

function Question({
  question,
  error,
  value,
}: {
  question: ApplicationQuestion;
  error?: string;
  value?: string;
}) {
  const hintId = question.hint ? `${question.name}-hint` : undefined;

  return (
    <div>
      <label
        htmlFor={question.name}
        className="field-label leading-relaxed"
      >
        {question.label}
        {question.required && <span className="text-gold"> *</span>}
      </label>
      {question.hint && (
        <p
          id={hintId}
          className="mb-2 text-xs text-slate"
        >
          {question.hint}
        </p>
      )}
      <textarea
        id={question.name}
        name={question.name}
        rows={question.rows ?? 5}
        required={question.required}
        minLength={question.rows === 3 ? 5 : 30}
        maxLength={3000}
        defaultValue={value ?? ""}
        className="field-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${question.name}-error` : hintId}
      />
      <FieldError
        name={question.name}
        error={error}
      />
    </div>
  );
}

export function CoachApplicationForm({ discordUsername, action }: Props) {
  const [state, formAction] = useActionState(action, null);
  const [step, setStep] = useState(0);
  const stepRefs = useRef<(HTMLFieldSetElement | null)[]>([]);
  const errors = state?.errors ?? {};
  const values = state?.values ?? {};

  // Jump to the first step that has a server-side error (derived state, updated during render).
  const [seenState, setSeenState] = useState(state);

  if (state !== seenState) {
    setSeenState(state);

    const firstStep = STEPS.findIndex((item) => item.fields.some((field) => state?.errors?.[field]));

    if (firstStep >= 0) {
      setStep(firstStep);
    }
  }

  const goNext = () => {
    const fields = stepRefs.current[step]?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea",
    );

    for (const field of Array.from(fields ?? [])) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }

    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    stepRefs.current[0]?.closest("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <form
      action={formAction}
      className="space-y-8"
    >
      <ol
        className="grid grid-cols-3 gap-2"
        aria-label="Application progress"
      >
        {STEPS.map((item, index) => (
          <li
            key={item.title}
            aria-current={index === step ? "step" : undefined}
          >
            <span className={`block h-1 rounded-full ${index <= step ? "bg-gold" : "bg-line-strong"}`} />
            <span className={`mt-2 block text-xs ${index === step ? "text-cream" : "text-slate"}`}>
              <span className="hidden sm:inline">
                {index + 1}. {item.title}
              </span>
              <span className="sm:hidden">Step {index + 1}</span>
            </span>
          </li>
        ))}
      </ol>

      <fieldset
        ref={(element) => {
          stepRefs.current[0] = element;
        }}
        className={`space-y-6 ${step === 0 ? "" : "hidden"}`}
      >
        <legend className="font-display text-lg font-semibold text-cream">Applicant information</legend>

        <div>
          <label
            htmlFor="discordUsername"
            className="field-label"
          >
            Discord Username
          </label>
          <input
            id="discordUsername"
            value={`@${discordUsername}`}
            readOnly
            disabled
            className="field-input cursor-not-allowed opacity-70"
            aria-describedby="discordUsername-hint"
          />
          <p
            id="discordUsername-hint"
            className="mt-1.5 text-xs text-slate"
          >
            From your Discord sign-in. This can&apos;t be edited.
          </p>
        </div>

        <div>
          <label
            htmlFor="email"
            className="field-label"
          >
            Email Address <span className="text-gold">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            defaultValue={values.email ?? ""}
            className="field-input"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : "email-hint"}
          />
          {errors.email ? (
            <FieldError
              name="email"
              error={errors.email}
            />
          ) : (
            <p
              id="email-hint"
              className="mt-1.5 text-xs text-slate"
            >
              We&apos;ll only use this for recruitment-related communication.
            </p>
          )}
        </div>

        <div
          role="radiogroup"
          aria-labelledby="position-label"
          aria-describedby={errors.position ? "position-error" : undefined}
        >
          <p
            id="position-label"
            className="field-label"
          >
            Which position are you applying for? <span className="text-gold">*</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {COACH_POSITIONS.map((position) => (
              <label
                key={position.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-strong px-4 py-3 text-sm text-cream transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold"
              >
                <input
                  type="radio"
                  name="position"
                  value={position.value}
                  defaultChecked={values.position === position.value}
                  required
                  className="h-4 w-4 accent-[#d4af6b]"
                />
                {position.label}
              </label>
            ))}
          </div>
          <FieldError
            name="position"
            error={errors.position}
          />
        </div>
      </fieldset>

      <fieldset
        ref={(element) => {
          stepRefs.current[1] = element;
        }}
        className={`space-y-6 ${step === 1 ? "" : "hidden"}`}
      >
        <legend className="font-display text-lg font-semibold text-cream">Experience & skills</legend>
        {EXPERIENCE_QUESTIONS.map((question) => (
          <Question
            key={question.name}
            question={question}
            error={errors[question.name]}
            value={values[question.name]}
          />
        ))}
      </fieldset>

      <fieldset
        ref={(element) => {
          stepRefs.current[2] = element;
        }}
        className={`space-y-6 ${step === 2 ? "" : "hidden"}`}
      >
        <legend className="font-display text-lg font-semibold text-cream">Teaching & agreements</legend>
        {TEACHING_QUESTIONS.map((question) => (
          <Question
            key={question.name}
            question={question}
            error={errors[question.name]}
            value={values[question.name]}
          />
        ))}

        <div>
          <label
            htmlFor="links"
            className="field-label"
          >
            Portfolio, LinkedIn or project links (optional)
          </label>
          <textarea
            id="links"
            name="links"
            rows={2}
            maxLength={500}
            placeholder="https://"
            defaultValue={values.links ?? ""}
            className="field-input"
            aria-invalid={errors.links ? true : undefined}
            aria-describedby={errors.links ? "links-error" : undefined}
          />
          <FieldError
            name="links"
            error={errors.links}
          />
        </div>

        <div className="space-y-3 border-t border-line pt-6">
          {AGREEMENTS.map((agreement) => (
            <div key={agreement.name}>
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-cream">
                <input
                  type="checkbox"
                  name={agreement.name}
                  defaultChecked={values[agreement.name] === "on"}
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-[#d4af6b]"
                  aria-invalid={errors[agreement.name] ? true : undefined}
                />
                {agreement.label}
              </label>
              <FieldError
                name={agreement.name}
                error={errors[agreement.name]}
              />
            </div>
          ))}
        </div>
      </fieldset>

      {state && !state.ok && <Notice tone="error">{state.message}</Notice>}

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setStep((current) => current - 1)}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn btn-gold"
            onClick={goNext}
          >
            Continue
          </button>
        ) : (
          <SubmitButton pendingLabel="Submitting…">
            <Check className="h-4 w-4" />
            Submit application
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
