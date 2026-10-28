import { Empty, Panel } from "@/components/coach/ui";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const stars = (rating: number) => `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;

// Member ratings from post-call Discord DMs. Shown without member identities.
export async function CallFeedbackPanel({ coachId, timezone }: { coachId: string; timezone: string }) {
  const [feedback, calls] = await Promise.all([
    prisma.callFeedback.findMany({
      where: { call: { coachId } },
      include: { call: { include: { session: { select: { title: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.coachCall.count({ where: { coachId, endedAt: { not: null } } }),
  ]);
  const average = feedback.length ? feedback.reduce((total, f) => total + f.rating, 0) / feedback.length : null;
  const counts = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: feedback.filter((f) => f.rating === rating).length }));

  return (
    <Panel title="Member feedback from calls">
      {feedback.length === 0 ? (
        <Empty>
          {calls
            ? "No ratings yet for your tracked calls."
            : "Run /startcall in your Discord voice channel and /endcall afterwards. Attendees get a DM asking them to rate the call."}
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
          <div>
            <p className="font-display text-4xl font-semibold text-cream">{average!.toFixed(1)}</p>
            <p className="mt-1 text-gold">{stars(Math.round(average!))}</p>
            <p className="mt-1 text-xs text-slate">
              {feedback.length} rating{feedback.length === 1 ? "" : "s"} across {calls} tracked call{calls === 1 ? "" : "s"}
            </p>
            <div className="mt-4 space-y-1">
              {counts.map(({ rating, count }) => (
                <div
                  key={rating}
                  className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2 text-xs"
                >
                  <span className="text-slate">{rating}★</span>
                  <span className="h-1.5 rounded-full bg-panel">
                    <span
                      className="block h-1.5 rounded-full bg-gold"
                      style={{ width: `${Math.round((count / feedback.length) * 100)}%` }}
                    />
                  </span>
                  <span className="text-right text-cream">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <ul className="space-y-4">
            {feedback.slice(0, 20).map((entry) => (
              <li
                key={entry.id}
                className="border-b border-line pb-4 last:border-0"
              >
                <p className="text-sm text-gold">{stars(entry.rating)}</p>
                <p className="mt-1 text-sm whitespace-pre-line text-cream">{entry.comment}</p>
                <p className="mt-1 text-xs text-slate">
                  {entry.call.session?.title ?? "Coaching call"} · {formatDate(entry.createdAt, timezone)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
