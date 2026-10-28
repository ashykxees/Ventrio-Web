"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveCoaches, getCoachContext, getCoachRoleIds, type CoachContext } from "@/lib/coach/access";
import { ActionError, links, optionalUrl, required, runAction, text, timezone, type ActionState } from "@/lib/coach/action";
import { audit, notify } from "@/lib/coach/activity";
import { CONFIG_FIELDS, DEFAULT_CONFIG, getCoachConfig, type CoachConfig } from "@/lib/coach/config";
import {
  canTransition,
  formatMoney,
  hasAnyRole,
  parseMoneyToCents,
  periodKey,
  REQUEST_LEADERSHIP_TRANSITIONS,
  SUBMISSION_LEADERSHIP_TRANSITIONS,
  TASK_LEADERSHIP_TRANSITIONS,
} from "@/lib/coach/rules";
import { fetchGuildMemberRoles } from "@/lib/discord-bot";
import { zonedLocalToUtc } from "@/lib/dates";
import { refreshScheduleBoard } from "@/lib/coach/schedule-board";

async function leadershipOnly(): Promise<CoachContext> {
  const ctx = await getCoachContext();

  if (!ctx?.isLeadership) {
    throw new ActionError("Leadership access required.");
  }

  return ctx;
}

function refresh(...paths: string[]) {
  revalidatePath("/coach", "layout");

  for (const path of paths) {
    revalidatePath(path);
  }
}

const id = z.string().min(1).max(40);
const optionalId = z.string().max(40).optional();

function money(value: FormDataEntryValue | null): number {
  const cents = parseMoneyToCents(String(value ?? ""));

  if (cents === null) {
    throw new ActionError("Enter an amount like 24 or 24.50.");
  }

  return cents;
}

function dateOnly(value: string, label: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ActionError(`Enter a valid ${label}.`);
  }

  return new Date(`${value}T12:00:00Z`);
}

// ---------- Coaches ----------

export async function updateCoach(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z
      .object({
        id,
        coachRole: text(80),
        expertise: text(500),
        responsibilities: text(2000),
        startDate: z.string().max(10),
        leadershipNotes: text(5000),
      })
      .parse(Object.fromEntries(formData));

    await prisma.coachProfile.update({
      where: { id: data.id },
      data: {
        coachRole: data.coachRole,
        expertise: data.expertise,
        responsibilities: data.responsibilities,
        leadershipNotes: data.leadershipNotes,
        startDate: data.startDate ? dateOnly(data.startDate, "start date") : null,
      },
    });
    await audit(ctx.userId, "COACH_UPDATED", "CoachProfile", data.id, { coachRole: data.coachRole });
    refresh(`/coach/leadership/coaches/${data.id}`);

    return "Coach saved.";
  });
}

export async function setCoachStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const coachId = id.parse(formData.get("id"));
    const status = z.enum(["ACTIVE", "DEACTIVATED"]).parse(formData.get("intent"));
    const coach = await prisma.coachProfile.update({ where: { id: coachId }, data: { status } });

    await audit(ctx.userId, status === "ACTIVE" ? "COACH_ACTIVATED" : "COACH_DEACTIVATED", "CoachProfile", coachId);
    await notify(coach.userId, {
      type: "ACCOUNT",
      title: status === "ACTIVE" ? "Your coach access is active" : "Your coach access was deactivated",
      href: "/coach",
    });
    refresh(`/coach/leadership/coaches/${coachId}`);

    return status === "ACTIVE" ? "Coach activated." : "Coach deactivated. Their records are kept.";
  });
}

export async function recheckCoachRoles(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    await leadershipOnly();
    const coach = await prisma.coachProfile.findUnique({ where: { id: id.parse(formData.get("id")) } });

    if (!coach) {
      throw new ActionError("Coach not found.");
    }

    const roles = await fetchGuildMemberRoles(coach.discordId);

    if (!roles) {
      throw new ActionError("Couldn't reach Discord. Check DISCORD_BOT_TOKEN and try again.");
    }

    await prisma.coachProfile.update({
      where: { id: coach.id },
      data: { discordRoles: roles.join(","), rolesCheckedAt: new Date() },
    });
    refresh(`/coach/leadership/coaches/${coach.id}`);

    return hasAnyRole(roles, getCoachRoleIds()) ? "Coach role confirmed." : "This member no longer has a coach role.";
  });
}

// ---------- Sessions ----------

export async function reviewSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z
      .object({ id, status: z.enum(["SCHEDULED", "NEEDS_ATTENTION", "COMPLETED"]), leadershipFeedback: text(2000) })
      .parse(Object.fromEntries(formData));
    const session = await prisma.coachSession.findUnique({ where: { id: data.id }, include: { coach: true } });

    if (!session) {
      throw new ActionError("Session not found.");
    }

    if (session.status === "CANCELLED") {
      throw new ActionError("Cancelled sessions can't be changed.");
    }

    await prisma.coachSession.update({
      where: { id: session.id },
      data: { status: data.status, leadershipFeedback: data.leadershipFeedback },
    });
    await prisma.sessionEvent.create({
      data: { sessionId: session.id, actorId: ctx.userId, action: `LEADERSHIP_${data.status}`, detail: data.leadershipFeedback },
    });
    await audit(ctx.userId, "SESSION_REVIEWED", "CoachSession", session.id, { status: data.status });

    if (data.status === "NEEDS_ATTENTION" || data.leadershipFeedback !== session.leadershipFeedback) {
      await notify(session.coach.userId, {
        type: "SESSION",
        title: data.status === "NEEDS_ATTENTION" ? `Leadership asked for a change to "${session.title}"` : `New feedback on "${session.title}"`,
        message: data.leadershipFeedback,
        href: `/coach/sessions/${session.id}`,
      });
    }

    void refreshScheduleBoard();
    refresh("/coach/leadership/sessions", `/coach/sessions/${session.id}`);

    return "Session updated.";
  });
}

export async function leadershipCancelSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const sessionId = id.parse(formData.get("id"));
    const reason = required(500).parse(formData.get("reason") ?? "");
    const session = await prisma.coachSession.findUnique({ where: { id: sessionId }, include: { coach: true } });

    if (!session || session.status === "CANCELLED" || session.status === "COMPLETED") {
      throw new ActionError("This session can't be cancelled.");
    }

    // Clearing weekKey frees the coach's weekly slot; the session stays in history.
    await prisma.coachSession.update({
      where: { id: session.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), weekKey: null },
    });
    await prisma.sessionEvent.create({
      data: { sessionId: session.id, actorId: ctx.userId, action: "LEADERSHIP_CANCELLED", detail: reason },
    });
    await audit(ctx.userId, "SESSION_CANCELLED", "CoachSession", session.id, { reason });
    await notify(session.coach.userId, {
      type: "SESSION",
      title: `Leadership cancelled "${session.title}"`,
      message: reason,
      href: `/coach/sessions/${session.id}`,
    });
    void refreshScheduleBoard();
    refresh("/coach/leadership/sessions", `/coach/sessions/${session.id}`, "/coach/sessions");

    return "Session cancelled and removed from the schedule embed.";
  });
}

export async function setSessionBoardVisibility(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const sessionId = id.parse(formData.get("id"));
    const hide = z.enum(["HIDE", "SHOW"]).parse(formData.get("intent")) === "HIDE";

    await prisma.coachSession.update({ where: { id: sessionId }, data: { hiddenFromBoard: hide } });
    await prisma.sessionEvent.create({
      data: { sessionId, actorId: ctx.userId, action: hide ? "REMOVED_FROM_BOARD" : "SHOWN_ON_BOARD" },
    });
    await audit(ctx.userId, hide ? "SESSION_REMOVED_FROM_BOARD" : "SESSION_SHOWN_ON_BOARD", "CoachSession", sessionId);
    void refreshScheduleBoard();
    refresh("/coach/leadership/sessions");

    return hide ? "Removed from the schedule embed." : "Back on the schedule embed.";
  });
}

// ---------- Requests ----------

export async function reviewRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z
      .object({ id, status: z.string().max(20), feedback: text(3000), internalNotes: text(5000), reviewerId: optionalId })
      .parse(Object.fromEntries(formData));
    const request = await prisma.coachRequest.findUnique({ where: { id: data.id }, include: { coach: true } });

    if (!request) {
      throw new ActionError("Request not found.");
    }

    const changed = data.status !== request.status;

    if (changed && !canTransition(REQUEST_LEADERSHIP_TRANSITIONS, request.status, data.status)) {
      throw new ActionError("That status change isn't allowed.");
    }

    if (changed && ["REJECTED", "MORE_INFO"].includes(data.status) && !data.feedback) {
      throw new ActionError("Add feedback for the coach explaining what's needed.");
    }

    await prisma.$transaction([
      prisma.coachRequest.update({
        where: { id: request.id },
        data: {
          status: data.status,
          feedback: data.feedback,
          internalNotes: data.internalNotes,
          reviewerId: data.reviewerId || ctx.userId,
          reviewedAt: changed ? new Date() : request.reviewedAt,
        },
      }),
      ...(changed
        ? [
            prisma.requestHistory.create({
              data: { requestId: request.id, actorId: ctx.userId, previousStatus: request.status, newStatus: data.status, comment: data.feedback },
            }),
          ]
        : []),
    ]);
    await audit(ctx.userId, "REQUEST_REVIEWED", "CoachRequest", request.id, { status: data.status });

    if (changed) {
      await notify(request.coach.userId, {
        type: "REQUEST",
        title: `Your request "${request.title}" is now ${data.status.replace("_", " ").toLowerCase()}`,
        message: data.feedback,
        href: `/coach/requests/${request.id}`,
      });
    }

    if (data.reviewerId && data.reviewerId !== request.reviewerId && data.reviewerId !== ctx.userId) {
      await notify(data.reviewerId, { type: "REQUEST", title: `Request assigned to you: ${request.title}`, href: `/coach/leadership/requests/${request.id}` });
    }

    refresh("/coach/leadership/requests", `/coach/leadership/requests/${request.id}`, `/coach/requests/${request.id}`);

    return "Request saved.";
  });
}

// ---------- Projects & payroll ----------

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z
      .object({ title: required(150), description: text(3000), projectType: text(80) })
      .parse(Object.fromEntries(formData));
    const project = await prisma.project.create({ data });

    await audit(ctx.userId, "PROJECT_CREATED", "Project", project.id);
    refresh("/coach/leadership/payroll");

    return "Project created.";
  });
}

export async function assignProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const config = await getCoachConfig();
    const data = z.object({ projectId: id, coachId: id, terms: text(1000) }).parse(Object.fromEntries(formData));
    const amountCents = money(formData.get("amount"));
    const [project, coach] = await Promise.all([
      prisma.project.findUnique({ where: { id: data.projectId } }),
      prisma.coachProfile.findUnique({ where: { id: data.coachId } }),
    ]);

    if (!project || project.status !== "OPEN" || !coach || coach.status !== "ACTIVE") {
      throw new ActionError("Choose an open project and an active coach.");
    }

    const assignment = await prisma.projectAssignment.create({
      data: { ...data, amountCents, currency: config.currency || "USD" },
    });

    await audit(ctx.userId, "PROJECT_ASSIGNED", "ProjectAssignment", assignment.id, { amountCents });
    await notify(coach.userId, {
      type: "PROJECT",
      title: `New project: ${project.title} (${formatMoney(amountCents, assignment.currency)} agreed)`,
      href: "/coach/payroll",
    });
    refresh("/coach/leadership/payroll", "/coach/payroll");

    return "Project assigned.";
  });
}

export async function setProjectStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const projectId = id.parse(formData.get("id"));
    const status = z.enum(["OPEN", "CLOSED"]).parse(formData.get("intent"));

    await prisma.project.update({ where: { id: projectId }, data: { status } });
    await audit(ctx.userId, `PROJECT_${status}`, "Project", projectId);
    refresh("/coach/leadership/payroll");

    return status === "OPEN" ? "Project reopened." : "Project closed.";
  });
}

export async function reviewSubmission(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z
      .object({ id, status: z.string().max(20), feedback: text(3000), period: z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM.") })
      .parse({ period: periodKey(new Date()), ...Object.fromEntries(formData) });
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: data.id },
      include: { assignment: { include: { project: true } }, coach: true },
    });

    if (!submission) {
      throw new ActionError("Submission not found.");
    }

    if (!canTransition(SUBMISSION_LEADERSHIP_TRANSITIONS, submission.status, data.status)) {
      throw new ActionError("That status change isn't allowed.");
    }

    if (["REVISION", "REJECTED"].includes(data.status) && !data.feedback) {
      throw new ActionError("Add feedback so the coach knows what to change.");
    }

    if (data.status === "APPROVED") {
      const amountCents = money(formData.get("amount"));

      if (amountCents !== submission.assignment.amountCents && !data.feedback) {
        throw new ActionError("The amount differs from the agreed fee. Add a note explaining why.");
      }

      // Approval and the payroll record succeed or fail together; the unique submissionId blocks duplicates.
      await prisma.$transaction(async (tx) => {
        const updated = await tx.projectSubmission.updateMany({
          where: { id: submission.id, status: submission.status },
          data: { status: "APPROVED", approvedAt: new Date(), reviewerId: ctx.userId, feedback: data.feedback },
        });

        if (updated.count !== 1) {
          throw new ActionError("This submission was already updated. Refresh the page.");
        }

        await tx.payrollRecord.create({
          data: {
            coachId: submission.coachId,
            submissionId: submission.id,
            assignmentId: submission.assignmentId,
            amountCents,
            currency: submission.assignment.currency,
            period: data.period,
            approvedById: ctx.userId,
            adminNotes: data.feedback,
          },
        });
      });
      await audit(ctx.userId, "WORK_APPROVED", "ProjectSubmission", submission.id, { amountCents, period: data.period });
    } else {
      await prisma.projectSubmission.update({
        where: { id: submission.id },
        data: { status: data.status, reviewerId: ctx.userId, feedback: data.feedback },
      });
      await audit(ctx.userId, `WORK_${data.status}`, "ProjectSubmission", submission.id);
    }

    await notify(submission.coach.userId, {
      type: "PROJECT",
      title: `"${submission.assignment.project.title}": ${data.status === "REVISION" ? "revision requested" : data.status.replace("_", " ").toLowerCase()}`,
      message: data.feedback,
      href: "/coach/payroll",
    });
    refresh("/coach/leadership/payroll", "/coach/payroll");

    return data.status === "APPROVED" ? "Approved. A pending payroll record was created." : "Submission updated.";
  });
}

export async function setPayrollStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const recordId = id.parse(formData.get("id"));
    const intent = z.enum(["PAID", "VOID"]).parse(formData.get("intent"));
    const note = text(1000).parse(formData.get("note") ?? "");

    if (intent === "VOID" && !note) {
      throw new ActionError("Add a note explaining why this record is void.");
    }

    // Only a pending record can change, so a payment can never be marked paid twice.
    const updated = await prisma.payrollRecord.updateMany({
      where: { id: recordId, status: "PENDING" },
      data:
        intent === "PAID"
          ? { status: "PAID", paidAt: new Date(), paidById: ctx.userId, ...(note ? { adminNotes: note } : {}) }
          : { status: "VOID", adminNotes: note },
    });

    if (updated.count !== 1) {
      throw new ActionError("Only pending records can be changed.");
    }

    const record = await prisma.payrollRecord.findUniqueOrThrow({ where: { id: recordId }, include: { coach: true } });

    await audit(ctx.userId, intent === "PAID" ? "PAYMENT_MARKED_PAID" : "PAYMENT_VOIDED", "PayrollRecord", recordId, {
      amountCents: record.amountCents,
      note,
    });
    await notify(record.coach.userId, {
      type: "PAYROLL",
      title: intent === "PAID" ? `Payment of ${formatMoney(record.amountCents, record.currency)} marked as paid` : "A payroll record was voided",
      message: note,
      href: "/coach/payroll",
    });
    refresh("/coach/leadership/payroll", "/coach/payroll");

    return intent === "PAID" ? "Marked as paid." : "Record voided.";
  });
}

export async function createAdjustment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const config = await getCoachConfig();
    const data = z
      .object({ coachId: id, period: z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM."), note: required(1000) })
      .parse(Object.fromEntries(formData));
    const amountCents = money(formData.get("amount"));
    const record = await prisma.payrollRecord.create({
      data: {
        coachId: data.coachId,
        amountCents,
        currency: config.currency || "USD",
        period: data.period,
        isAdjustment: true,
        approvedById: ctx.userId,
        adminNotes: data.note,
      },
    });

    await audit(ctx.userId, "PAYROLL_ADJUSTMENT", "PayrollRecord", record.id, { amountCents, note: data.note });
    refresh("/coach/leadership/payroll", "/coach/payroll");

    return "Adjustment recorded as pending.";
  });
}

// ---------- Resources ----------

export async function reviewResource(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z
      .object({ id, intent: z.enum(["PUBLISHED", "REVISION", "ARCHIVED"]), feedback: text(3000) })
      .parse(Object.fromEntries(formData));
    const resource = await prisma.coachResource.findUnique({ where: { id: data.id } });

    if (!resource) {
      throw new ActionError("Resource not found.");
    }

    if (data.intent === "REVISION" && !data.feedback) {
      throw new ActionError("Add feedback describing the revisions needed.");
    }

    await prisma.$transaction([
      prisma.coachResource.update({ where: { id: resource.id }, data: { status: data.intent } }),
      prisma.resourceReview.create({
        data: { resourceId: resource.id, reviewerId: ctx.userId, status: data.intent, feedback: data.feedback },
      }),
    ]);
    await audit(ctx.userId, `RESOURCE_${data.intent}`, "CoachResource", resource.id);

    if (resource.authorId !== ctx.userId) {
      await notify(resource.authorId, {
        type: "RESOURCE",
        title: `"${resource.title}": ${data.intent === "REVISION" ? "revision requested" : data.intent.toLowerCase()}`,
        message: data.feedback,
        href: `/coach/resources/${resource.id}`,
      });
    }

    refresh("/coach/leadership/resources", `/coach/leadership/resources/${resource.id}`, "/coach/resources");

    return "Resource updated.";
  });
}

export async function createLeadershipResource(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const config = await getCoachConfig();
    const data = z
      .object({ title: required(150), description: text(1000), category: required(80), url: optionalUrl, content: text(20000) })
      .parse(Object.fromEntries(formData));

    if (!config.resourceCategories.includes(data.category)) {
      throw new ActionError("Choose one of the listed categories.");
    }

    if (!data.url && !data.content) {
      throw new ActionError("Add a link or the content.");
    }

    const resource = await prisma.coachResource.create({ data: { ...data, authorId: ctx.userId, status: "PUBLISHED" } });

    await audit(ctx.userId, "RESOURCE_PUBLISHED", "CoachResource", resource.id);
    refresh("/coach/leadership/resources", "/coach/resources");

    return "Resource published.";
  });
}

// ---------- Tasks ----------

export async function createTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z
      .object({
        title: required(150),
        description: text(5000),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
        due: z.string().max(20),
        timezone,
        links,
        checklist: text(3000),
      })
      .parse(Object.fromEntries(formData));
    const dueAt = data.due ? zonedLocalToUtc(data.due, data.timezone) : null;
    const active = await getActiveCoaches();
    const selected = formData.getAll("coachIds").map(String);
    const coaches = formData.get("allCoaches") === "on" ? active : active.filter((coach) => selected.includes(coach.id));

    if (coaches.length === 0) {
      throw new ActionError("Choose at least one coach.");
    }

    const { due: _due, ...fields } = data;
    void _due;
    const task = await prisma.coachTask.create({
      data: {
        ...fields,
        dueAt,
        createdById: ctx.userId,
        assignments: { create: coaches.map((coach) => ({ coachId: coach.id })) },
      },
    });

    await audit(ctx.userId, "TASK_CREATED", "CoachTask", task.id, { coaches: coaches.length });
    await notify(
      coaches.map((coach) => coach.userId),
      { type: "TASK", title: `New task: ${task.title}`, href: "/coach/tasks", dedupeKey: `task:${task.id}` },
    );
    refresh("/coach/leadership/tasks", "/coach/tasks");

    return `Task assigned to ${coaches.length} coach${coaches.length === 1 ? "" : "es"}.`;
  });
}

export async function reviewTaskAssignment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z.object({ id, status: z.string().max(20), comment: text(2000) }).parse(Object.fromEntries(formData));
    const assignment = await prisma.taskAssignment.findUnique({ where: { id: data.id }, include: { task: true, coach: true } });

    if (!assignment) {
      throw new ActionError("Assignment not found.");
    }

    if (data.status !== assignment.status && !canTransition(TASK_LEADERSHIP_TRANSITIONS, assignment.status, data.status)) {
      throw new ActionError("That status change isn't allowed.");
    }

    await prisma.taskAssignment.update({
      where: { id: assignment.id },
      data: { status: data.status, completedAt: data.status === "COMPLETED" ? new Date() : null },
    });

    if (data.comment) {
      await prisma.taskComment.create({
        data: { taskId: assignment.taskId, coachId: assignment.coachId, authorId: ctx.userId, comment: data.comment },
      });
    }

    await audit(ctx.userId, "TASK_REVIEWED", "TaskAssignment", assignment.id, { status: data.status });
    await notify(assignment.coach.userId, {
      type: "TASK",
      title: `"${assignment.task.title}": ${data.status === "REVISION" ? "revision requested" : data.status.replace("_", " ").toLowerCase()}`,
      message: data.comment,
      href: `/coach/tasks/${assignment.id}`,
    });
    refresh(`/coach/leadership/tasks/${assignment.taskId}`, "/coach/tasks");

    return "Assignment updated.";
  });
}

export async function cancelTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const taskId = id.parse(formData.get("id"));

    await prisma.$transaction([
      prisma.coachTask.update({ where: { id: taskId }, data: { status: "CANCELLED" } }),
      prisma.taskAssignment.updateMany({ where: { taskId, status: { not: "COMPLETED" } }, data: { status: "CANCELLED" } }),
    ]);
    await audit(ctx.userId, "TASK_CANCELLED", "CoachTask", taskId);
    refresh("/coach/leadership/tasks", `/coach/leadership/tasks/${taskId}`, "/coach/tasks");

    return "Task cancelled.";
  });
}

// ---------- Performance reviews ----------

export async function saveReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const config = await getCoachConfig();
    const data = z
      .object({
        id: optionalId,
        coachId: id,
        periodStart: z.string(),
        periodEnd: z.string(),
        rating: text(80),
        internalNotes: text(5000),
        intent: z.enum(["draft", "finalize"]),
      })
      .parse(Object.fromEntries(formData));
    const periodStart = dateOnly(data.periodStart, "period start");
    const periodEnd = dateOnly(data.periodEnd, "period end");

    if (periodEnd < periodStart) {
      throw new ActionError("The period end must be after the start.");
    }

    if (data.rating && config.ratingScale.length > 0 && !config.ratingScale.includes(data.rating)) {
      throw new ActionError("Choose a rating from the configured scale.");
    }

    const content: Record<string, string> = {};

    config.reviewCategories.forEach((category, index) => {
      const value = text(4000).parse(formData.get(`category_${index}`) ?? "");

      if (value) {
        content[category] = value;
      }
    });

    const finalize = data.intent === "finalize";
    const fields = {
      coachId: data.coachId,
      periodStart,
      periodEnd,
      rating: data.rating,
      internalNotes: data.internalNotes,
      content: JSON.stringify(content),
      reviewerId: ctx.userId,
      ...(finalize ? { status: "FINAL", finalizedAt: new Date() } : {}),
    };

    if (finalize && Object.keys(content).length === 0) {
      throw new ActionError("Write feedback in at least one category before finalizing.");
    }

    let reviewId = data.id;

    if (reviewId) {
      const existing = await prisma.performanceReview.findUnique({ where: { id: reviewId } });

      if (!existing || existing.status === "FINAL") {
        throw new ActionError("Finalized reviews can't be edited.");
      }

      await prisma.performanceReview.update({ where: { id: reviewId }, data: fields });
    } else {
      reviewId = (await prisma.performanceReview.create({ data: fields })).id;
    }

    if (finalize) {
      const coach = await prisma.coachProfile.findUniqueOrThrow({ where: { id: data.coachId } });

      await audit(ctx.userId, "REVIEW_FINALIZED", "PerformanceReview", reviewId);
      await notify(coach.userId, {
        type: "REVIEW",
        title: "A new performance review is ready",
        href: "/coach/performance",
        dedupeKey: `review:${reviewId}`,
      });
    }

    refresh("/coach/leadership/reviews", `/coach/leadership/reviews/${reviewId}`, "/coach/performance");

    return finalize ? "Review finalized and shared with the coach." : "Draft saved.";
  });
}

// ---------- Announcements ----------

export async function saveAnnouncement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z
      .object({
        id: optionalId,
        title: required(150),
        body: required(10000),
        category: text(60),
        audience: text(80),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
        publishAt: z.string().max(20),
        expiresAt: z.string().max(20),
        timezone,
      })
      .parse(Object.fromEntries(formData));
    const publishAt = data.publishAt ? zonedLocalToUtc(data.publishAt, data.timezone) : null;
    const expiresAt = data.expiresAt ? zonedLocalToUtc(data.expiresAt, data.timezone) : null;

    if (publishAt && expiresAt && expiresAt <= publishAt) {
      throw new ActionError("The expiry must be after the publish time.");
    }

    const fields = {
      title: data.title,
      body: data.body,
      category: data.category || "General",
      audience: data.audience,
      status: data.status,
      publishAt: publishAt ?? (data.status === "PUBLISHED" ? new Date() : null),
      expiresAt,
      important: formData.get("important") === "on",
      pinned: formData.get("pinned") === "on",
    };
    const announcement = data.id
      ? await prisma.coachAnnouncement.update({ where: { id: data.id }, data: fields })
      : await prisma.coachAnnouncement.create({ data: { ...fields, authorId: ctx.userId } });

    await audit(ctx.userId, data.id ? "ANNOUNCEMENT_UPDATED" : "ANNOUNCEMENT_CREATED", "CoachAnnouncement", announcement.id, {
      status: data.status,
    });
    refresh("/coach/leadership/announcements", "/coach/announcements");

    return data.id ? "Announcement saved." : "Announcement created.";
  });
}

// ---------- Policies ----------

export async function savePolicy(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z
      .object({ id: optionalId, title: required(150), category: required(80), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) })
      .parse(Object.fromEntries(formData));
    const fields = { title: data.title, category: data.category, requiresAck: formData.get("requiresAck") === "on" };

    if (data.id) {
      const existing = await prisma.policy.findUniqueOrThrow({ where: { id: data.id } });

      if (data.status === "PUBLISHED" && existing.currentVersion === 0) {
        throw new ActionError("Publish a version with the policy text first.");
      }

      await prisma.policy.update({ where: { id: data.id }, data: { ...fields, status: data.status } });
      await audit(ctx.userId, "POLICY_UPDATED", "Policy", data.id, { status: data.status });
    } else {
      const policy = await prisma.policy.create({ data: fields });

      await audit(ctx.userId, "POLICY_CREATED", "Policy", policy.id);
    }

    refresh("/coach/leadership/policies", "/coach/policies");

    return "Policy saved.";
  });
}

export async function publishPolicyVersion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const data = z.object({ id, content: required(50000) }).parse(Object.fromEntries(formData));
    const policy = await prisma.$transaction(async (tx) => {
      const current = await tx.policy.findUniqueOrThrow({ where: { id: data.id } });
      const version = current.currentVersion + 1;

      await tx.policyVersion.create({ data: { policyId: current.id, version, content: data.content, createdById: ctx.userId } });

      return tx.policy.update({ where: { id: current.id }, data: { currentVersion: version, status: "PUBLISHED" } });
    });

    await audit(ctx.userId, "POLICY_VERSION_PUBLISHED", "Policy", policy.id, { version: policy.currentVersion });

    if (policy.requiresAck) {
      const coaches = await getActiveCoaches();

      await notify(
        coaches.map((coach) => coach.userId),
        {
          type: "POLICY",
          title: `Please review and acknowledge: ${policy.title} (v${policy.currentVersion})`,
          href: "/coach/policies",
          dedupeKey: `policy:${policy.id}:v${policy.currentVersion}`,
        },
      );
    }

    refresh("/coach/leadership/policies", `/coach/leadership/policies/${policy.id}`, "/coach/policies");

    return `Version ${policy.currentVersion} published.`;
  });
}

// ---------- Settings ----------

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await leadershipOnly();
    const current = await getCoachConfig();
    const next: Record<string, unknown> = {};

    for (const field of CONFIG_FIELDS) {
      const raw = String(formData.get(field.key) ?? "");

      if (field.kind === "boolean") {
        next[field.key] = formData.get(field.key) === "on";
      } else if (field.kind === "list") {
        next[field.key] = raw
          .split("\n")
          .map((line) => line.trim().slice(0, 120))
          .filter(Boolean)
          .slice(0, 40);
      } else {
        next[field.key] = raw.trim().slice(0, 1000);
      }
    }

    const config = { ...DEFAULT_CONFIG, ...next } as CoachConfig;

    if (config.sessionTypes.length === 0 || config.requestCategories.length === 0 || config.resourceCategories.length === 0) {
      throw new ActionError("Session types, request categories and resource categories each need at least one entry.");
    }

    if (config.sessionDurations.some((value) => !/^\d{2,3}$/.test(value))) {
      throw new ActionError("Durations must be whole numbers of minutes.");
    }

    if (!/^[A-Z]{3}$/.test(config.currency)) {
      throw new ActionError("Currency must be a 3-letter code such as USD.");
    }

    const changed = CONFIG_FIELDS.filter((field) => JSON.stringify(current[field.key]) !== JSON.stringify(config[field.key])).map(
      (field) => field.key,
    );

    await prisma.coachSetting.upsert({
      where: { key: "config" },
      create: { key: "config", value: JSON.stringify(config), updatedById: ctx.userId },
      update: { value: JSON.stringify(config), updatedById: ctx.userId },
    });
    await audit(ctx.userId, "SETTINGS_UPDATED", "CoachSetting", "config", { changed });
    refresh("/coach/leadership/settings");

    return changed.length ? `Saved ${changed.length} change${changed.length === 1 ? "" : "s"}.` : "No changes.";
  });
}

