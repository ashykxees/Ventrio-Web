import type { BadgeTone } from "@/components/ui";

type Option = { value: string; label: string };

export const SESSION_STATUSES: Option[] = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "RESCHEDULED", label: "Rescheduled" },
  { value: "NEEDS_ATTENTION", label: "Needs attention" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const REQUEST_STATUSES: Option[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "MORE_INFO", label: "More info required" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export const WORK_STATUSES: Option[] = [
  { value: "SUBMITTED", label: "Work submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "REVISION", label: "Revision requested" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export const PAYROLL_STATUSES: Option[] = [
  { value: "PENDING", label: "Payment pending" },
  { value: "PAID", label: "Paid" },
  { value: "VOID", label: "Void" },
];

export const RESOURCE_STATUSES: Option[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "In review" },
  { value: "REVISION", label: "Revision requested" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export const TASK_STATUSES: Option[] = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "SUBMITTED", label: "Submitted for review" },
  { value: "REVISION", label: "Revision requested" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const TASK_PRIORITIES: Option[] = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export const PUBLISH_STATUSES: Option[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export const STATUS_TONE: Record<string, BadgeTone> = {
  SCHEDULED: "gold",
  RESCHEDULED: "blue",
  NEEDS_ATTENTION: "red",
  COMPLETED: "green",
  CANCELLED: "neutral",
  DRAFT: "neutral",
  SUBMITTED: "blue",
  UNDER_REVIEW: "blue",
  MORE_INFO: "gold",
  REVISION: "gold",
  APPROVED: "green",
  REJECTED: "red",
  WITHDRAWN: "neutral",
  PENDING: "gold",
  PAID: "green",
  VOID: "neutral",
  PUBLISHED: "green",
  ARCHIVED: "neutral",
  NOT_STARTED: "neutral",
  IN_PROGRESS: "blue",
  FINAL: "green",
  ACTIVE: "green",
  DEACTIVATED: "red",
  OPEN: "gold",
  CLOSED: "neutral",
  LOW: "neutral",
  NORMAL: "neutral",
  HIGH: "gold",
  URGENT: "red",
};

export const COACH_NAV = [
  { href: "/coach", label: "Overview" },
  { href: "/coach/sessions", label: "Sessions" },
  { href: "/coach/requests", label: "Requests" },
  { href: "/coach/payroll", label: "Payroll" },
  { href: "/coach/resources", label: "Lessons & Resources" },
  { href: "/coach/tasks", label: "Tasks" },
  { href: "/coach/performance", label: "Performance" },
  { href: "/coach/announcements", label: "Announcements" },
  { href: "/coach/policies", label: "Policies" },
  { href: "/coach/profile", label: "Profile & Settings" },
];

export const LEADERSHIP_NAV = [
  { href: "/coach/leadership", label: "Admin Overview" },
  { href: "/coach/leadership/coaches", label: "Coaches" },
  { href: "/coach/leadership/sessions", label: "Session Management" },
  { href: "/coach/leadership/requests", label: "Request Queue" },
  { href: "/coach/leadership/payroll", label: "Payroll Management" },
  { href: "/coach/leadership/resources", label: "Lessons & Resources" },
  { href: "/coach/leadership/tasks", label: "Task Management" },
  { href: "/coach/leadership/reviews", label: "Performance Reviews" },
  { href: "/coach/leadership/announcements", label: "Announcements" },
  { href: "/coach/leadership/policies", label: "Policies & Acks" },
  { href: "/coach/leadership/reports", label: "Reports & Analytics" },
  { href: "/coach/leadership/settings", label: "Admin Settings" },
];
