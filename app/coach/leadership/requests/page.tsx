import Link from "next/link";
import { AdminTable, cell } from "@/components/admin/AdminTable";
import { Select } from "@/components/coach/fields";
import { PageTitle, StatusBadge } from "@/components/coach/ui";
import { coachName, getActiveCoaches, requireLeadership } from "@/lib/coach/access";
import { getCoachConfig } from "@/lib/coach/config";
import { REQUEST_STATUSES } from "@/lib/coach/constants";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Request Queue" };

export default async function LeadershipRequestsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const ctx = await requireLeadership();
  const param = (key: string) => (typeof sp[key] === "string" ? String(sp[key]).slice(0, 80) : "");
  const status = param("status");
  const category = param("category");
  const coachId = param("coach");
  const q = param("q");
  const from = /^\d{4}-\d{2}-\d{2}$/.test(param("from")) ? param("from") : "";
  const [config, coaches, requests] = await Promise.all([
    getCoachConfig(),
    getActiveCoaches(),
    prisma.coachRequest.findMany({
      where: {
        // Drafts stay private to the coach until submitted.
        status: status ? status : { not: "DRAFT" },
        ...(category ? { category } : {}),
        ...(coachId ? { coachId } : {}),
        ...(q ? { title: { contains: q } } : {}),
        ...(from ? { createdAt: { gte: new Date(`${from}T00:00:00Z`) } } : {}),
      },
      include: { coach: { include: { user: { include: { profile: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);
  const unresolved = requests.filter((r) => ["SUBMITTED", "UNDER_REVIEW", "MORE_INFO"].includes(r.status));
  const reviewed = requests.filter((r) => r.reviewedAt);
  const avgHours = reviewed.length
    ? Math.round(reviewed.reduce((t, r) => t + (r.reviewedAt!.getTime() - r.createdAt.getTime()), 0) / reviewed.length / 3600000)
    : null;

  return (
    <>
      <PageTitle
        title="Request Queue"
        description={`${unresolved.length} unresolved · average time to first review ${avgHours === null ? "—" : `${avgHours} h`}`}
      />
      <form className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end">
        <label className="block lg:col-span-2">
          <span className="field-label">Search title</span>
          <input
            name="q"
            defaultValue={q}
            className="field-input"
          />
        </label>
        <Select
          label="Status"
          name="status"
          options={REQUEST_STATUSES.filter((s) => s.value !== "DRAFT")}
          placeholder="All"
          defaultValue={status}
        />
        <Select
          label="Category"
          name="category"
          options={config.requestCategories}
          placeholder="All"
          defaultValue={category}
        />
        <Select
          label="Coach"
          name="coach"
          options={coaches.map((c) => ({ value: c.id, label: coachName(c) }))}
          placeholder="All"
          defaultValue={coachId}
        />
        <label className="block">
          <span className="field-label">Since</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="field-input"
          />
        </label>
        <button
          type="submit"
          className="btn btn-outline btn-sm"
        >
          Filter
        </button>
      </form>
      <AdminTable
        headers={["Request", "Coach", "Category", "Status", "Submitted", ""]}
        empty={requests.length === 0}
      >
        {requests.map((request) => (
          <tr key={request.id}>
            <td className={`${cell} text-cream`}>{request.title}</td>
            <td className={cell}>{coachName(request.coach)}</td>
            <td className={cell}>{request.category}</td>
            <td className={cell}>
              <StatusBadge
                status={request.status}
                options={REQUEST_STATUSES}
              />
            </td>
            <td className={cell}>{formatDate(request.createdAt, ctx.timezone)}</td>
            <td className={`${cell} text-right`}>
              <Link
                href={`/coach/leadership/requests/${request.id}`}
                className="text-gold"
              >
                Review
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
