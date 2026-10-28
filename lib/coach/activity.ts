import { prisma } from "@/lib/prisma";

export async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  await prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, metadata: JSON.stringify(metadata) },
  });
}

type NotificationInput = {
  type: string;
  title: string;
  message?: string;
  href?: string;
  // Same key + user is only ever stored once, so re-processing an event never duplicates it.
  dedupeKey?: string;
};

export async function notify(userIds: string | string[], input: NotificationInput) {
  const ids = Array.from(new Set(Array.isArray(userIds) ? userIds : [userIds]));

  for (const userId of ids) {
    const data = {
      userId,
      type: input.type,
      title: input.title,
      message: input.message ?? "",
      href: input.href ?? "",
    };

    if (input.dedupeKey) {
      const dedupeKey = `${input.dedupeKey}:${userId}`;

      await prisma.coachNotification.upsert({
        where: { dedupeKey },
        create: { ...data, dedupeKey },
        update: {},
      });
    } else {
      await prisma.coachNotification.create({ data });
    }
  }
}
