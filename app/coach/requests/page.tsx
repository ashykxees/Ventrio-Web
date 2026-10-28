import { RequestForm } from "@/components/coach/RequestForm";
import { Empty, List, PageTitle, Panel, Row, StatusBadge } from "@/components/coach/ui";
import { requireCoach } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { REQUEST_STATUSES } from "@/lib/coach/constants";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Requests" };

export default async function CoachRequestsPage() {
  const ctx = await requireCoach();
  const [config, requests] = await Promise.all([
    getCoachConfig(),
    prisma.coachRequest.findMany({ where: { coachId: ctx.coach.id }, orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <>
      <PageTitle
        title="Requests"
        description="Ask leadership for schedule changes, resources, approvals or support, and track each decision."
      />
      <Panel title="New request">
        <RequestForm categories={config.requestCategories} />
      </Panel>
      <Panel title="Your requests">
        {requests.length === 0 ? (
          <Empty>You haven&apos;t submitted any requests yet.</Empty>
        ) : (
          <List>
            {requests.map((request) => (
              <Row
                key={request.id}
                href={`/coach/requests/${request.id}`}
              >
                <div>
                  <p className="text-sm text-cream">{request.title}</p>
                  <p className="text-xs text-slate">
                    {request.category} · {formatDate(request.createdAt, ctx.timezone)}
                  </p>
                </div>
                <StatusBadge
                  status={request.status}
                  options={REQUEST_STATUSES}
                />
              </Row>
            ))}
          </List>
        )}
      </Panel>
    </>
  );
}
