"use client";

import { useState, type ImgHTMLAttributes, type ReactNode } from "react";

// Third-party images can disappear or block hotlinking; show the fallback instead of a broken icon.
export function SafeImage({ fallback, ...props }: ImgHTMLAttributes<HTMLImageElement> & { fallback: ReactNode }) {
  const [failedSrc, setFailedSrc] = useState<unknown>(null);

  if (!props.src || failedSrc === props.src) {
    return fallback;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt is passed through props
    <img
      {...props}
      onError={() => setFailedSrc(props.src)}
    />
  );
}
