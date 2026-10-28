import Link from "next/link";
import { markNotificationsRead } from "@/app/actions/coach";
import { ActionForm } from "@/components/coach/ActionForm";
import { Hidden } from "@/components/coach/fields";
import { Empty, List, PageTitle, Panel } from "@/components/coach/ui";
import { requireCoachContext } from "@/lib/coach/access";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const ctx = await requireCoachContext();
  const notifications = await prisma.coachNotification.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <PageTitle
        title="Notifications"
        description="In-app notifications about your sessions, requests, tasks, payroll, reviews and policies."
      >
        {unread > 0 && (
          <ActionForm
            action={markNotificationsRead}
            submitLabel="Mark all read"
            variant="outline"
            className=""
          >
            {null}
          </ActionForm>
        )}
      </PageTitle>
      <Panel>
        {notifications.length === 0 ? (
          <Empty>No notifications yet.</Empty>
        ) : (
          <List>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className={`text-sm ${notification.readAt ? "text-slate" : "font-medium text-cream"}`}>
                    {!notification.readAt && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold" />}
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        className="hover:text-gold"
                      >
                        {notification.title}
                      </Link>
                    ) : (
                      notification.title
                    )}
                  </p>
                  {notification.message && <p className="mt-1 text-xs whitespace-pre-line text-slate">{notification.message}</p>}
                  <p className="mt-1 text-xs text-slate">{formatDateTime(notification.createdAt, ctx.timezone)}</p>
                </div>
                {!notification.readAt && (
                  <ActionForm
                    action={markNotificationsRead}
                    submitLabel="Mark read"
                    variant="outline"
                    className=""
                  >
                    <Hidden
                      name="id"
                      value={notification.id}
                    />
                  </ActionForm>
                )}
              </div>
            ))}
          </List>
        )}
      </Panel>
    </>
  );
}
