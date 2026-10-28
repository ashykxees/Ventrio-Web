"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCoachContext, getLeadershipUserIds, type ActiveCoachContext } from "@/lib/coach/access";
import { ActionError, links, optionalUrl, required, runAction, text, timezone, type ActionState } from "@/lib/coach/action";
import { audit, notify } from "@/lib/coach/activity";
import { getCoachConfig } from "@/lib/coach/config";
import {
  canTransition,
  isoWeekKey,
  REQUEST_COACH_TRANSITIONS,
  TASK_COACH_TRANSITIONS,
} from "@/lib/coach/rules";
import { zonedLocalToUtc } from "@/lib/dates";
import { refreshScheduleBoard } from "@/lib/coach/schedule-board";

async function coachOnly(): Promise<ActiveCoachContext> {
  const ctx = await getCoachContext();

  if (!ctx?.canCoach || !ctx.coach) {
    throw new ActionError("You don't have coach access.");
  }

  return ctx as ActiveCoachContext;
}

function refresh(...paths: string[]) {
  for (const path of ["/coach", "/coach/leadership", ...paths]) {
    revalidatePath(path);
  }
}

const id = z.string().min(1).max(40);

// ---------- Sessions ----------

const sessionSchema = z.object({
  id: z.string().max(40).optional(),
  title: required(120),
  sessionType: required(60),
  topic: required(200),
  objectives: text(2000),
  audience: text(300),
  start: z.string().min(1, "Choose a date and start time."),
  timezone,
  durationMinutes: z.coerce.number().int().min(15, "Sessions must be at least 15 minutes.").max(480, "Sessions can be at most 8 hours."),
  platform: required(60),
  meetingUrl: optionalUrl,
  prepNotes: text(3000),
  resources: text(3000),
  notesForLeadership: text(2000),
});

export async function saveSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const config = await getCoachConfig();
    const data = sessionSchema.parse(Object.fromEntries(formData));
    const startAt = zonedLocalToUtc(data.start, data.timezone);

    if (!startAt || Number.isNaN(startAt.getTime())) {
      throw new ActionError("Enter a valid date and start time.");
    }

    if (!config.sessionTypes.includes(data.sessionType)) {
      throw new ActionError("Choose one of the listed session types.");
    }

    if (config.meetingPlatforms.length > 0 && !config.meetingPlatforms.includes(data.platform)) {
      throw new ActionError("Choose one of the approved meeting platforms.");
    }

    if (config.sessionDurations.length > 0 && !config.sessionDurations.includes(String(data.durationMinutes))) {
      throw new ActionError(`Duration must be one of: ${config.sessionDurations.join(", ")} minutes.`);
    }

    const countsForWeek = formData.get("countsForWeek") === "on";
    const weekKey = countsForWeek ? isoWeekKey(startAt, data.timezone) : null;
    const { id: sessionId, start: _start, ...fields } = data;
    void _start;

    if (weekKey) {
      const clash = await prisma.coachSession.findFirst({
        where: { coachId: ctx.coach.id, weekKey, NOT: sessionId ? { id: sessionId } : undefined },
      });

      if (clash) {
        throw new ActionError(
          `"${clash.title}" already counts as your weekly call for that week. Untick "This is my weekly coaching call" to add an extra session.`,
        );
      }
    }

    if (sessionId) {
      const existing = await prisma.coachSession.findFirst({ where: { id: sessionId, coachId: ctx.coach.id } });

      if (!existing) {
        throw new ActionError("Session not found.");
      }

      if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
        throw new ActionError("Cancelled or completed sessions can't be edited.");
      }

      const moved = existing.startAt.getTime() !== startAt.getTime();

      if (moved && startAt.getTime() < Date.now()) {
        throw new ActionError("Choose a start time in the future.");
      }

      await prisma.coachSession.update({
        where: { id: existing.id },
        data: { ...fields, startAt, weekKey, status: moved ? "RESCHEDULED" : existing.status },
      });
      await prisma.sessionEvent.create({
        data: {
          sessionId: existing.id,
          actorId: ctx.userId,
          action: moved ? "RESCHEDULED" : "EDITED",
          detail: moved ? `From ${existing.startAt.toISOString()} to ${startAt.toISOString()}` : "",
        },
      });

      if (moved) {
        await notify(await getLeadershipUserIds(), {
          type: "SESSION",
          title: `${ctx.profile.displayName} rescheduled "${fields.title}"`,
          href: `/coach/leadership/sessions`,
        });
      }

      void refreshScheduleBoard();
      refresh("/coach/sessions", `/coach/sessions/${existing.id}`, "/coach/leadership/sessions");

      return moved ? "Session rescheduled." : "Session updated.";
    }

    if (startAt.getTime() < Date.now()) {
      throw new ActionError("Choose a start time in the future.");
    }

    const session = await prisma.coachSession.create({
      data: { ...fields, startAt, weekKey, coachId: ctx.coach.id },
    });

    await prisma.sessionEvent.create({ data: { sessionId: session.id, actorId: ctx.userId, action: "SCHEDULED" } });
    void refreshScheduleBoard();
    refresh("/coach/sessions", "/coach/leadership/sessions");

    return "Session scheduled.";
  });
}

export async function cancelSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const sessionId = id.parse(formData.get("id"));
    const reason = text(500).parse(formData.get("reason") ?? "");
    const session = await prisma.coachSession.findFirst({ where: { id: sessionId, coachId: ctx.coach.id } });

    if (!session || session.status === "CANCELLED" || session.status === "COMPLETED") {
      throw new ActionError("This session can't be cancelled.");
    }

    // Clearing weekKey frees the weekly slot; the cancelled session stays in history.
    await prisma.coachSession.update({
      where: { id: session.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), weekKey: null },
    });
    await prisma.sessionEvent.create({
      data: { sessionId: session.id, actorId: ctx.userId, action: "CANCELLED", detail: reason },
    });
    await notify(await getLeadershipUserIds(), {
      type: "SESSION",
      title: `${ctx.profile.displayName} cancelled "${session.title}"`,
      message: reason,
      href: "/coach/leadership/sessions",
    });
    void refreshScheduleBoard();
    refresh("/coach/sessions", `/coach/sessions/${session.id}`, "/coach/leadership/sessions");

    return "Session cancelled.";
  });
}

const reportSchema = z.object({
  id,
  occurred: z.enum(["yes", "no"]),
  attendance: z.string().trim().max(6).optional(),
  topicsCovered: text(3000),
  resourcesUsed: text(2000),
  followUp: text(2000),
  notes: text(2000),
});

export async function submitSessionReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const data = reportSchema.parse(Object.fromEntries(formData));
    const session = await prisma.coachSession.findFirst({ where: { id: data.id, coachId: ctx.coach.id } });

    if (!session || session.status === "CANCELLED") {
      throw new ActionError("Session not found.");
    }

    if (session.startAt.getTime() > Date.now()) {
      throw new ActionError("You can record the outcome once the session has started.");
    }

    const attendance = data.attendance ? Number(data.attendance) : null;

    if (attendance !== null && (!Number.isInteger(attendance) || attendance < 0)) {
      throw new ActionError("Attendance must be a whole number.");
    }

    const report = {
      occurred: data.occurred === "yes",
      attendance,
      topicsCovered: data.topicsCovered,
      resourcesUsed: data.resourcesUsed,
      followUp: data.followUp,
      notes: data.notes,
    };

    await prisma.$transaction([
      prisma.sessionReport.upsert({
        where: { sessionId: session.id },
        create: { ...report, sessionId: session.id, submittedById: ctx.userId },
        update: report,
      }),
      prisma.coachSession.update({
        where: { id: session.id },
        data: { status: report.occurred ? "COMPLETED" : "NEEDS_ATTENTION" },
      }),
      prisma.sessionEvent.create({
        data: { sessionId: session.id, actorId: ctx.userId, action: "REPORTED", detail: report.occurred ? "Held" : "Did not happen" },
      }),
    ]);
    refresh("/coach/sessions", `/coach/sessions/${session.id}`, "/coach/leadership/sessions");

    return "Session report saved.";
  });
}

// ---------- Requests ----------

const requestSchema = z.object({
  id: z.string().max(40).optional(),
  title: required(150),
  category: required(80),
  description: required(5000),
  requestedDate: z.string().max(10).optional(),
  links,
  intent: z.enum(["draft", "submit"]),
});

export async function saveRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const config = await getCoachConfig();
    const data = requestSchema.parse(Object.fromEntries(formData));

    if (!config.requestCategories.includes(data.category)) {
      throw new ActionError("Choose one of the listed categories.");
    }

    const requestedDate = data.requestedDate ? new Date(`${data.requestedDate}T12:00:00Z`) : null;

    if (requestedDate && Number.isNaN(requestedDate.getTime())) {
      throw new ActionError("Enter a valid date.");
    }

    const newStatus = data.intent === "submit" ? "SUBMITTED" : "DRAFT";
    const fields = {
      title: data.title,
      category: data.category,
      description: data.description,
      links: data.links,
      requestedDate,
    };
    let requestId = data.id;

    if (requestId) {
      const existing = await prisma.coachRequest.findFirst({ where: { id: requestId, coachId: ctx.coach.id } });

      if (!existing || !["DRAFT", "MORE_INFO"].includes(existing.status)) {
        throw new ActionError("This request can no longer be edited.");
      }

      if (newStatus === "DRAFT" && existing.status === "MORE_INFO") {
        await prisma.coachRequest.update({ where: { id: existing.id }, data: fields });

        return "Changes saved. Submit when you're ready.";
      }

      if (existing.status !== newStatus && !canTransition(REQUEST_COACH_TRANSITIONS, existing.status, newStatus)) {
        throw new ActionError("That status change isn't allowed.");
      }

      await prisma.$transaction([
        prisma.coachRequest.update({ where: { id: existing.id }, data: { ...fields, status: newStatus } }),
        ...(existing.status !== newStatus
          ? [
              prisma.requestHistory.create({
                data: { requestId: existing.id, actorId: ctx.userId, previousStatus: existing.status, newStatus },
              }),
            ]
          : []),
      ]);
    } else {
      const created = await prisma.coachRequest.create({
        data: { ...fields, status: newStatus, coachId: ctx.coach.id },
      });

      requestId = created.id;
      await prisma.requestHistory.create({ data: { requestId, actorId: ctx.userId, newStatus } });
    }

    if (newStatus === "SUBMITTED") {
      await notify(await getLeadershipUserIds(), {
        type: "REQUEST",
        title: `New request from ${ctx.profile.displayName}: ${data.title}`,
        href: `/coach/leadership/requests/${requestId}`,
      });
    }

    refresh("/coach/requests", `/coach/requests/${requestId}`, "/coach/leadership/requests");

    return newStatus === "SUBMITTED" ? "Request submitted." : "Draft saved.";
  });
}

export async function withdrawRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const requestId = id.parse(formData.get("id"));
    const existing = await prisma.coachRequest.findFirst({ where: { id: requestId, coachId: ctx.coach.id } });

    if (!existing || !canTransition(REQUEST_COACH_TRANSITIONS, existing.status, "WITHDRAWN")) {
      throw new ActionError("This request can't be withdrawn.");
    }

    await prisma.$transaction([
      prisma.coachRequest.update({ where: { id: existing.id }, data: { status: "WITHDRAWN" } }),
      prisma.requestHistory.create({
        data: { requestId: existing.id, actorId: ctx.userId, previousStatus: existing.status, newStatus: "WITHDRAWN" },
      }),
    ]);
    refresh("/coach/requests", `/coach/requests/${existing.id}`, "/coach/leadership/requests");

    return "Request withdrawn.";
  });
}

// ---------- Project work ----------

const workSchema = z.object({
  assignmentId: id,
  description: required(5000),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the completion date."),
  links,
  notes: text(2000),
});

export async function submitProjectWork(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const data = workSchema.parse(Object.fromEntries(formData));
    const assignment = await prisma.projectAssignment.findFirst({
      where: { id: data.assignmentId, coachId: ctx.coach.id },
      include: { project: true, submissions: { orderBy: { createdAt: "desc" } } },
    });

    if (!assignment) {
      throw new ActionError("Project not found.");
    }

    const completedAt = new Date(`${data.completedAt}T12:00:00Z`);

    if (completedAt.getTime() > Date.now() + 86400000) {
      throw new ActionError("The completion date can't be in the future.");
    }

    const latest = assignment.submissions[0];
    const fields = { description: data.description, completedAt, links: data.links, notes: data.notes };

    if (latest && ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(latest.status)) {
      throw new ActionError("You've already submitted this project. Leadership will review it.");
    }

    if (latest?.status === "REVISION") {
      await prisma.projectSubmission.update({ where: { id: latest.id }, data: { ...fields, status: "SUBMITTED" } });
    } else {
      await prisma.projectSubmission.create({
        data: { ...fields, assignmentId: assignment.id, coachId: ctx.coach.id },
      });
    }

    await notify(await getLeadershipUserIds(), {
      type: "PROJECT",
      title: `${ctx.profile.displayName} submitted work for "${assignment.project.title}"`,
      href: "/coach/leadership/payroll",
    });
    refresh("/coach/payroll", "/coach/leadership/payroll");

    return "Work submitted for review.";
  });
}

// ---------- Resources ----------

const resourceSchema = z.object({
  id: z.string().max(40).optional(),
  title: required(150),
  description: text(1000),
  category: required(80),
  url: optionalUrl,
  content: text(20000),
  intent: z.enum(["draft", "submit"]),
});

export async function saveResource(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const config = await getCoachConfig();
    const data = resourceSchema.parse(Object.fromEntries(formData));

    if (!config.resourceCategories.includes(data.category)) {
      throw new ActionError("Choose one of the listed categories.");
    }

    if (!data.url && !data.content) {
      throw new ActionError("Add a link or the lesson content.");
    }

    const status = data.intent === "submit" ? "SUBMITTED" : "DRAFT";
    const fields = {
      title: data.title,
      description: data.description,
      category: data.category,
      url: data.url,
      content: data.content,
      status,
    };
    let resourceId = data.id;

    if (resourceId) {
      const existing = await prisma.coachResource.findFirst({ where: { id: resourceId, authorId: ctx.userId } });

      if (!existing || !["DRAFT", "REVISION"].includes(existing.status)) {
        throw new ActionError("This resource can't be edited right now.");
      }

      await prisma.coachResource.update({
        where: { id: existing.id },
        data: { ...fields, version: existing.status === "REVISION" && status === "SUBMITTED" ? existing.version + 1 : existing.version },
      });
    } else {
      resourceId = (await prisma.coachResource.create({ data: { ...fields, authorId: ctx.userId } })).id;
    }

    if (status === "SUBMITTED") {
      await notify(await getLeadershipUserIds(), {
        type: "RESOURCE",
        title: `${ctx.profile.displayName} submitted "${data.title}" for review`,
        href: `/coach/leadership/resources/${resourceId}`,
      });
    }

    refresh("/coach/resources", `/coach/resources/${resourceId}`, "/coach/leadership/resources");

    return status === "SUBMITTED" ? "Submitted for review." : "Draft saved.";
  });
}

// ---------- Tasks ----------

export async function updateMyTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const data = z
      .object({ id, status: z.string().max(20), submission: text(5000), comment: text(2000) })
      .parse({ submission: "", comment: "", ...Object.fromEntries(formData) });
    const assignment = await prisma.taskAssignment.findFirst({
      where: { id: data.id, coachId: ctx.coach.id },
      include: { task: true },
    });

    if (!assignment || assignment.task.status === "CANCELLED") {
      throw new ActionError("Task not found.");
    }

    if (data.status !== assignment.status && !canTransition(TASK_COACH_TRANSITIONS, assignment.status, data.status)) {
      throw new ActionError("That status change isn't allowed.");
    }

    if (data.status === "SUBMITTED" && !data.submission && !assignment.submission) {
      throw new ActionError("Describe or link the work you're submitting.");
    }

    await prisma.taskAssignment.update({
      where: { id: assignment.id },
      data: { status: data.status, submission: data.submission || assignment.submission },
    });

    if (data.comment) {
      await prisma.taskComment.create({
        data: { taskId: assignment.taskId, coachId: ctx.coach.id, authorId: ctx.userId, comment: data.comment },
      });
    }

    if (data.status === "SUBMITTED" && assignment.status !== "SUBMITTED") {
      await notify(assignment.task.createdById, {
        type: "TASK",
        title: `${ctx.profile.displayName} submitted "${assignment.task.title}"`,
        href: `/coach/leadership/tasks/${assignment.taskId}`,
      });
    }

    refresh("/coach/tasks", `/coach/tasks/${assignment.id}`, `/coach/leadership/tasks/${assignment.taskId}`);

    return "Task updated.";
  });
}

// ---------- Reviews, policies, announcements, notifications ----------

export async function acknowledgeReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const review = await prisma.performanceReview.findFirst({
      where: { id: id.parse(formData.get("id")), coachId: ctx.coach.id, status: "FINAL" },
    });

    if (!review) {
      throw new ActionError("Review not found.");
    }

    if (!review.acknowledgedAt) {
      await prisma.performanceReview.update({ where: { id: review.id }, data: { acknowledgedAt: new Date() } });
    }

    refresh("/coach/performance", "/coach/leadership/reviews");

    return "Thanks — marked as read.";
  });
}

export async function acknowledgePolicy(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const version = await prisma.policyVersion.findUnique({
      where: { id: id.parse(formData.get("versionId")) },
      include: { policy: true },
    });

    // Only the current published version can be acknowledged; older acks never carry over.
    if (!version || version.policy.status !== "PUBLISHED" || version.version !== version.policy.currentVersion) {
      throw new ActionError("This policy version is no longer current. Refresh the page.");
    }

    await prisma.policyAck.upsert({
      where: { policyVersionId_userId: { policyVersionId: version.id, userId: ctx.userId } },
      create: { policyVersionId: version.id, userId: ctx.userId },
      update: {},
    });
    refresh("/coach/policies", "/coach/leadership/policies");

    return "Acknowledged.";
  });
}

export async function markAnnouncementsRead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const ids = String(formData.get("ids") ?? "")
      .split(",")
      .filter(Boolean)
      .slice(0, 200);

    for (const announcementId of ids) {
      await prisma.announcementRead.upsert({
        where: { announcementId_userId: { announcementId, userId: ctx.userId } },
        create: { announcementId, userId: ctx.userId },
        update: {},
      });
    }

    refresh("/coach/announcements");

    return "Marked as read.";
  });
}

export async function markNotificationsRead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await getCoachContext();

    if (!ctx || (!ctx.canCoach && !ctx.isLeadership)) {
      throw new ActionError("Not authorized.");
    }

    const notificationId = formData.get("id");

    await prisma.coachNotification.updateMany({
      where: { userId: ctx.userId, readAt: null, ...(notificationId ? { id: String(notificationId) } : {}) },
      data: { readAt: new Date() },
    });
    refresh("/coach/notifications");

    return "Marked as read.";
  });
}

const profileSchema = z.object({
  bio: text(1500),
  expertise: text(500),
  availability: text(1000),
  timezone,
});

export async function updateCoachProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await coachOnly();
    const data = profileSchema.parse(Object.fromEntries(formData));

    // Only these fields are coach-editable; role, status and notes are leadership-only.
    await prisma.coachProfile.update({ where: { id: ctx.coach.id }, data });
    await audit(ctx.userId, "PROFILE_UPDATED", "CoachProfile", ctx.coach.id);
    refresh("/coach/profile");

    return "Profile saved.";
  });
}
