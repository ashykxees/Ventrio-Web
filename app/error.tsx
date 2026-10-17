"use client";

import Link from "next/link";
import { VMark } from "@/components/Logo";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container-page flex flex-col items-center py-28 text-center">
      <VMark className="h-14 w-auto text-gold" />
      <h1 className="display mt-10 text-3xl text-cream">Something went wrong</h1>
      <p className="mt-4 max-w-md text-slate">
        We couldn&apos;t load this page. Please try again in a moment.
      </p>
      <div className="mt-10 flex gap-3">
        <button
          type="button"
          className="btn btn-gold"
          onClick={() => reset()}
        >
          Try again
        </button>
        <Link
          href="/"
          className="btn btn-outline"
        >
          Home
        </Link>
      </div>
    </section>
  );
}
