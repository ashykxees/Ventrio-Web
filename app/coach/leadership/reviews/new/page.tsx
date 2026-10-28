import Link from "next/link";
import { ReviewForm } from "@/components/coach/ReviewForm";
import { Empty, PageTitle, Panel } from "@/components/coach/ui";
import { coachName, getActiveCoaches, requireLeadership } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";

export const metadata = { title: "New review" };

export default async function NewReviewPage() {
  await requireLeadership();
  const [config, coaches] = await Promise.all([getCoachConfig(), getActiveCoaches()]);

  return (
    <>
      <PageTitle
        title="New performance review"
        description={config.ratingScale.length ? "Written feedback plus an optional rating." : "Written-only review (no rating scale configured)."}
      />
      <Link
        href="/coach/leadership/reviews"
        className="text-sm text-gold"
      >
        ← All reviews
      </Link>
      <Panel>
        {coaches.length === 0 ? (
          <Empty>No active coaches yet.</Empty>
        ) : (
          <ReviewForm
            config={config}
            coaches={coaches.map((c) => ({ value: c.id, label: coachName(c) }))}
          />
        )}
      </Panel>
    </>
  );
}
