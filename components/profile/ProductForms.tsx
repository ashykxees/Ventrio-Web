"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { ImagePlus, Link2 } from "lucide-react";
import type { ActionState } from "@/lib/coach/action";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/products";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const KINDS = [
  { value: "WEBSITE", label: "Website" },
  { value: "APP", label: "App" },
  { value: "DIGITAL", label: "Digital product" },
];

function Status({ state }: { state: ActionState }) {
  if (!state) return null;

  return (
    <p
      className={`text-sm ${state.ok ? "text-emerald-300" : "text-red-300"}`}
      role={state.ok ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}

function useSubmit(action: Action, onSuccess?: () => void) {
  const [state, dispatch, isPending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);

    if (result?.ok) {
      onSuccess?.();
    }

    return result;
  }, null);
  const [, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return { state, isPending, onSubmit };
}

export function AddProductForm({ action, disabled }: { action: Action; disabled?: boolean }) {
  const [kind, setKind] = useState("WEBSITE");
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const { state, isPending, onSubmit } = useSubmit(action, () => {
    formRef.current?.reset();
    setKind("WEBSITE");
    setPreview("");
  });

  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <div
        role="radiogroup"
        aria-label="What are you adding?"
        className="inline-flex rounded-md border border-line-strong p-0.5"
      >
        {KINDS.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              kind === option.value ? "bg-gold/15 text-gold" : "text-slate hover:text-cream"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value={option.value}
              checked={kind === option.value}
              onChange={() => {
                setKind(option.value);
                setFileError("");
                setPreview("");
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate" />
          <label
            htmlFor="product-url"
            className="sr-only"
          >
            Link to your website or app
          </label>
          <input
            id="product-url"
            name="url"
            inputMode="url"
            required
            maxLength={500}
            placeholder={kind === "APP" ? "Paste your App Store, Google Play or app link" : "Paste a link to your website"}
            className="field-input pl-9"
            disabled={disabled}
          />
        </div>
        <button
          type="submit"
          className="btn btn-gold btn-sm shrink-0"
          disabled={disabled || isPending || Boolean(fileError)}
          aria-busy={isPending}
        >
          {isPending ? "Fetching details…" : "Add"}
        </button>
      </div>

      {kind === "DIGITAL" && (
        <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-dashed border-line-strong p-4 hover:border-gold/60">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-16 w-28 rounded-md object-cover"
            />
          ) : (
            <span className="flex h-16 w-28 items-center justify-center rounded-md bg-panel">
              <ImagePlus className="h-6 w-6 text-gold" />
            </span>
          )}
          <span>
            <span className="block text-sm text-cream">Product image (required)</span>
            <span className={`mt-0.5 block text-xs ${fileError ? "text-red-300" : "text-slate"}`}>
              {fileError || "A picture of your product as it's shown. PNG, JPG, WebP or GIF, up to 2 MB."}
            </span>
          </span>
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp,image/gif"
            required
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileError(file && file.size > PRODUCT_IMAGE_MAX_BYTES ? "That image is over 2 MB." : "");
              setPreview(file ? URL.createObjectURL(file) : "");
            }}
          />
        </label>
      )}

      <p className="text-xs text-slate">
        We pull the title, description, logo and thumbnail from the page automatically.
      </p>
      <Status state={state} />
    </form>
  );
}

export function ProductActions({
  id,
  isDigital,
  refreshAction,
  removeAction,
  imageAction,
}: {
  id: string;
  isDigital: boolean;
  refreshAction: Action;
  removeAction: Action;
  imageAction: Action;
}) {
  const refresh = useSubmit(refreshAction);
  const remove = useSubmit(removeAction);
  const image = useSubmit(imageAction);
  const imageForm = useRef<HTMLFormElement>(null);
  const [lastAction, setLastAction] = useState<"refresh" | "remove" | "image" | null>(null);
  const state = lastAction ? { refresh, remove, image }[lastAction].state : null;
  const track = (name: "refresh" | "remove" | "image", handler: (event: FormEvent<HTMLFormElement>) => void) => (event: FormEvent<HTMLFormElement>) => {
    setLastAction(name);
    handler(event);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        <form onSubmit={track("refresh", refresh.onSubmit)}>
          <input
            type="hidden"
            name="id"
            value={id}
          />
          <button
            type="submit"
            className="btn btn-ghost btn-sm"
            disabled={refresh.isPending}
          >
            {refresh.isPending ? "Refreshing…" : "Refresh"}
          </button>
        </form>
        {isDigital && (
          <form
            ref={imageForm}
            onSubmit={track("image", image.onSubmit)}
          >
            <input
              type="hidden"
              name="id"
              value={id}
            />
            <label className="btn btn-ghost btn-sm cursor-pointer">
              {image.isPending ? "Uploading…" : "Change image"}
              <input
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={() => imageForm.current?.requestSubmit()}
              />
            </label>
          </form>
        )}
        <form
          onSubmit={(event) => {
            if (!window.confirm("Remove this from your profile?")) {
              event.preventDefault();
              return;
            }
            setLastAction("remove");
            remove.onSubmit(event);
          }}
          className="ml-auto"
        >
          <input
            type="hidden"
            name="id"
            value={id}
          />
          <button
            type="submit"
            className="btn btn-ghost btn-sm text-red-300"
            disabled={remove.isPending}
          >
            Remove
          </button>
        </form>
      </div>
      <Status state={state} />
    </div>
  );
}
