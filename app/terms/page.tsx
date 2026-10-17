import type { Metadata } from "next";
import Link from "next/link";
import { Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms of Use",
};

const SECTIONS = [
  {
    title: "Using Ventrio",
    body: "Ventrio is an educational community for young entrepreneurs ages 13–19. By creating an account you agree to follow these terms and our community guidelines.",
  },
  {
    title: "Your account",
    body: "You sign in with your own Discord account. Keep it secure and do not share access. You are responsible for what you post on your profile and in submissions.",
  },
  {
    title: "Community conduct",
    body: "Be respectful, honest and appropriate for a teen audience. Harassment, spam, scams, hateful content and sharing other people's personal information are not allowed. We may remove content or accounts that break these rules.",
  },
  {
    title: "Educational content",
    body: "Lessons, coaching and feedback are for educational purposes only and are not financial, legal or tax advice. Results are never guaranteed — building a business takes work, and outcomes vary.",
  },
  {
    title: "Competitions",
    body: "Each competition lists its own eligibility, requirements, deadlines and judging criteria. Prizes are only offered when they are listed as confirmed on the competition page. You keep ownership of the ideas you submit.",
  },
  {
    title: "Changes",
    body: "We may update these terms as Ventrio grows. We will post the updated version on this page.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Use"
        description="The ground rules for being part of the Ventrio community."
      />
      <section className="container-page max-w-3xl py-16">
        <Notice tone="warning">
          These are placeholder terms. Have them reviewed by a qualified professional before launch.
        </Notice>
        <div className="mt-12 space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-lg font-semibold text-cream">{section.title}</h2>
              <p className="mt-4 leading-relaxed text-slate">{section.body}</p>
            </div>
          ))}
          <p className="text-slate">
            Questions?{" "}
            <Link
              href="/contact"
              className="text-gold hover:text-gold-soft"
            >
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
