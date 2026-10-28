import { acknowledgeReview } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden } from "@/components/coach/fields";
import { CallFeedbackPanel } from "@/components/coach/CallFeedback";
import { Empty, PageTitle, Panel } from "@/components/coach/ui";
import { requireCoach, userNames } from "@/lib/coach/access";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Performance" };

export default async function CoachPerformancePage() {
  const ctx = await requireCoach();
  // Only finalized reviews for this coach; internal leadership notes are never selected.
  const reviews = await prisma.performanceReview.findMany({
    where: { coachId: ctx.coach.id, status: "FINAL" },
    select: { id: true, reviewerId: true, periodStart: true, periodEnd: true, content: true, rating: true, finalizedAt: true, acknowledgedAt: true },
    orderBy: { finalizedAt: "desc" },
  });
  const names = await userNames(reviews.map((r) => r.reviewerId));

  return (
    <>
      <PageTitle
        title="Performance"
        description="Your finalized reviews. Acknowledging a review means you've read it, not that you agree with every point."
      />
      <CallFeedbackPanel
        coachId={ctx.coach.id}
        timezone={ctx.timezone}
      />
      {reviews.length === 0 ? (
        <Empty>No performance reviews yet.</Empty>
      ) : (
        reviews.map((review) => {
          const content = JSON.parse(review.content) as Record<string, string>;

          return (
            <Panel
              key={review.id}
              title={`${formatDate(review.periodStart, "UTC")} – ${formatDate(review.periodEnd, "UTC")}`}
            >
              <p className="text-xs text-slate">
                By {names.get(review.reviewerId) ?? "Leadership"} · Finalized {review.finalizedAt ? formatDate(review.finalizedAt, ctx.timezone) : ""}
                {review.rating && ` · Rating: ${review.rating}`}
              </p>
              <dl className="mt-4 space-y-4">
                {Object.entries(content).map(([category, text]) => (
                  <div key={category}>
                    <dt className="text-xs tracking-wide text-gold uppercase">{category}</dt>
                    <dd className="mt-1 text-sm whitespace-pre-line text-cream">{text}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                {review.acknowledgedAt ? (
                  <p className="text-sm text-emerald-300">Read on {formatDate(review.acknowledgedAt, ctx.timezone)}</p>
                ) : (
                  <ActionForm
                    action={acknowledgeReview}
                    submitLabel="I've read this review"
                  >
                    <Hidden
                      name="id"
                      value={review.id}
                    />
                  </ActionForm>
                )}
              </div>
            </Panel>
          );
        })
      )}
    </>
  );
}
