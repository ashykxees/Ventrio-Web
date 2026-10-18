import Link from "next/link";
import { VMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <section className="container-page flex flex-col items-center py-28 text-center">
      <VMark className="h-14 w-auto text-gold" />
      <p className="eyebrow mt-10">404</p>
      <h1 className="display mt-4 text-3xl text-cream">Page not found</h1>
      <p className="mt-4 max-w-md text-slate">
        The page you&apos;re looking for doesn&apos;t exist or isn&apos;t available.
      </p>
      <Link
        href="/"
        className="btn btn-gold mt-10"
      >
        Back to home
      </Link>
    </section>
  );
}
