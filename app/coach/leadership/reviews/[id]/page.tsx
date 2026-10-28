import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/coach/ReviewForm";
import { Detail, PageTitle, Panel } from "@/components/coach/ui";
import { coachName, requireLeadership, userNames } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function LeadershipReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await requireLeadership();
  const [config, review] = await Promise.all([
    getCoachConfig(),
    prisma.performanceReview.findUnique({ where: { id }, include: { coach: { include: { user: { include: { profile: true } } } } } }),
  ]);

  if (!review) {
    notFound();
  }

  const names = await userNames([review.reviewerId]);
  const content = JSON.parse(review.content) as Record<string, string>;

  return (
    <>
      <PageTitle
        title={`Review: ${coachName(review.coach)}`}
        description={`${formatDate(review.periodStart, "UTC")} – ${formatDate(review.periodEnd, "UTC")} · by ${names.get(review.reviewerId) ?? "—"}`}
      />
      <Link
        href="/coach/leadership/reviews"
        className="text-sm text-gold"
      >
        ← All reviews
      </Link>
      {review.status === "FINAL" ? (
        <Panel>
          <dl className="space-y-4">
            {Object.entries(content).map(([category, text]) => (
              <Detail
                key={category}
                label={category}
              >
                {text}
              </Detail>
            ))}
            {review.rating && <Detail label="Rating">{review.rating}</Detail>}
            <Detail label="Internal notes (leadership only)">{review.internalNotes}</Detail>
            <Detail label="Finalized">{review.finalizedAt ? formatDate(review.finalizedAt, ctx.timezone) : ""}</Detail>
            <Detail label="Read by coach">{review.acknowledgedAt ? formatDate(review.acknowledgedAt, ctx.timezone) : "Not yet"}</Detail>
          </dl>
        </Panel>
      ) : (
        <Panel>
          <ReviewForm
            config={config}
            coaches={[{ value: review.coachId, label: coachName(review.coach) }]}
            review={review}
          />
        </Panel>
      )}
    </>
  );
}
