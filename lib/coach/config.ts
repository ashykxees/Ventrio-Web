import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Operational rules leadership can change at /coach/leadership/settings.
// Only values the coach brief already established have defaults; everything else starts "Not configured".
export type CoachConfig = {
  sessionTypes: string[];
  sessionDurations: string[];
  meetingPlatforms: string[];
  schedulingDeadline: string;
  cancellationRules: string;
  completionRequirements: string;
  attendanceTracking: boolean;
  requestCategories: string[];
  resourceCategories: string[];
  coachRoles: string[];
  compensationType: string;
  compensationRange: string;
  currency: string;
  paymentFrequency: string;
  paymentEligibility: string;
  paymentDate: string;
  paymentMethods: string;
  projectApprovalRules: string;
  reviewCategories: string[];
  ratingScale: string[];
  reviewFrequency: string;
};

export const DEFAULT_CONFIG: CoachConfig = {
  sessionTypes: ["Group coaching", "Workshop", "Other"],
  sessionDurations: [],
  meetingPlatforms: [],
  schedulingDeadline: "",
  cancellationRules: "",
  completionRequirements: "",
  attendanceTracking: false,
  requestCategories: [
    "Schedule change",
    "Absence or availability",
    "Workshop or event proposal",
    "Resource or software request",
    "Lesson or material approval",
    "Project or initiative proposal",
    "Support needed from leadership",
    "Other",
  ],
  resourceCategories: [
    "Marketing",
    "Business strategy",
    "Entrepreneurship",
    "Faith and leadership",
    "Workshop materials",
    "Templates and worksheets",
    "General coaching resources",
  ],
  coachRoles: ["Marketing Coach", "Business Strategy Coach"],
  compensationType: "Project-based",
  compensationRange: "$20–$28 per project",
  currency: "USD",
  paymentFrequency: "Monthly",
  paymentEligibility: "Completed work, subject to review and approval",
  paymentDate: "",
  paymentMethods: "",
  projectApprovalRules: "",
  reviewCategories: [
    "Session preparation and reliability",
    "Lesson and resource quality",
    "Communication and professionalism",
    "Responsiveness to members",
    "Task completion and organization",
    "Contribution to Ventrio's mission and values",
    "Areas for improvement",
    "Goals for the next review period",
  ],
  ratingScale: [],
  reviewFrequency: "",
};

type FieldKind = "list" | "text" | "boolean";

export const CONFIG_FIELDS: { key: keyof CoachConfig; label: string; kind: FieldKind; hint?: string; group: string }[] = [
  { group: "Sessions", key: "sessionTypes", label: "Session types", kind: "list" },
  { group: "Sessions", key: "sessionDurations", label: "Permitted durations (minutes)", kind: "list", hint: "One per line. Blank = any duration from 15 to 480 minutes." },
  { group: "Sessions", key: "meetingPlatforms", label: "Approved meeting platforms", kind: "list", hint: "Blank = coaches type the platform." },
  { group: "Sessions", key: "schedulingDeadline", label: "Weekly scheduling deadline", kind: "text", hint: "e.g. \"Schedule by Friday each week\". Shown to coaches as a reminder only." },
  { group: "Sessions", key: "cancellationRules", label: "Cancellation and rescheduling rules", kind: "text" },
  { group: "Sessions", key: "completionRequirements", label: "Session completion requirements", kind: "text" },
  { group: "Sessions", key: "attendanceTracking", label: "Track attendance counts in session reports", kind: "boolean" },
  { group: "Requests & resources", key: "requestCategories", label: "Request categories", kind: "list" },
  { group: "Requests & resources", key: "resourceCategories", label: "Resource categories", kind: "list" },
  { group: "Coaches", key: "coachRoles", label: "Coach roles", kind: "list" },
  { group: "Compensation", key: "compensationType", label: "Compensation type", kind: "text" },
  { group: "Compensation", key: "compensationRange", label: "Stated range", kind: "text" },
  { group: "Compensation", key: "currency", label: "Currency (ISO code)", kind: "text" },
  { group: "Compensation", key: "paymentFrequency", label: "Payment frequency", kind: "text" },
  { group: "Compensation", key: "paymentEligibility", label: "Payment eligibility", kind: "text" },
  { group: "Compensation", key: "paymentDate", label: "Monthly payment processing date", kind: "text" },
  { group: "Compensation", key: "paymentMethods", label: "Payment methods and procedures", kind: "text" },
  { group: "Compensation", key: "projectApprovalRules", label: "Project approval rules", kind: "text" },
  { group: "Performance", key: "reviewCategories", label: "Review categories", kind: "list" },
  { group: "Performance", key: "ratingScale", label: "Rating scale options", kind: "list", hint: "Blank = written-only reviews." },
  { group: "Performance", key: "reviewFrequency", label: "Review frequency", kind: "text" },
];

export const getCoachConfig = cache(async (): Promise<CoachConfig> => {
  const row = await prisma.coachSetting.findUnique({ where: { key: "config" } });

  if (!row) {
    return DEFAULT_CONFIG;
  }

  try {
    return { ...DEFAULT_CONFIG, ...(JSON.parse(row.value) as Partial<CoachConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
});

export function notConfigured(value: string): string {
  return value.trim() || "Not configured";
}
