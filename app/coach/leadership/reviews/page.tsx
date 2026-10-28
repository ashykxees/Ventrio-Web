import Link from "next/link";
import { AdminTable, cell } from "@/components/admin/AdminTable";
import { PageTitle, StatusBadge } from "@/components/coach/ui";
import { coachName, requireLeadership } from "@/lib/coach/access";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Performance Reviews" };

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "FINAL", label: "Final" },
];

export default async function LeadershipReviewsPage() {
  await requireLeadership();
  const reviews = await prisma.performanceReview.findMany({
    include: { coach: { include: { user: { include: { profile: true } } } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <PageTitle
        title="Performance Reviews"
        description="Drafts are private to leadership. Coaches see a review only after it's finalized."
      >
        <Link
          href="/coach/leadership/reviews/new"
          className="btn btn-gold btn-sm"
        >
          New review
        </Link>
      </PageTitle>
      <AdminTable
        headers={["Coach", "Period", "Status", "Read by coach", ""]}
        empty={reviews.length === 0}
      >
        {reviews.map((review) => (
          <tr key={review.id}>
            <td className={`${cell} text-cream`}>{coachName(review.coach)}</td>
            <td className={cell}>
              {formatDate(review.periodStart, "UTC")} – {formatDate(review.periodEnd, "UTC")}
            </td>
            <td className={cell}>
              <StatusBadge
                status={review.status}
                options={STATUSES}
              />
            </td>
            <td className={cell}>{review.acknowledgedAt ? formatDate(review.acknowledgedAt, "UTC") : "—"}</td>
            <td className={`${cell} text-right`}>
              <Link
                href={`/coach/leadership/reviews/${review.id}`}
                className="text-gold"
              >
                {review.status === "FINAL" ? "View" : "Edit"}
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
