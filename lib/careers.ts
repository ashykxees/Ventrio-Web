import type { BadgeTone } from "@/components/ui";

export const COACH_POSITIONS = [
  { value: "MARKETING", label: "Marketing Coach" },
  { value: "STRATEGY", label: "Business Strategy Coach" },
  { value: "BOTH", label: "Both positions" },
];

export const APPLICATION_STATUSES = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "NOT_SELECTED", label: "Not selected" },
];

export const APPLICATION_TONE: Record<string, BadgeTone> = {
  SUBMITTED: "neutral",
  IN_REVIEW: "blue",
  INTERVIEW: "gold",
  ACCEPTED: "green",
  NOT_SELECTED: "neutral",
};

export type ApplicationQuestion = {
  name: string;
  label: string;
  hint?: string;
  required: boolean;
  rows?: number;
};

export const EXPERIENCE_QUESTIONS: ApplicationQuestion[] = [
  {
    name: "experience",
    label:
      "Briefly describe your relevant experience, projects, skills, or qualifications related to the position(s) you selected.",
    required: true,
  },
  {
    name: "expertise",
    label: "What topics could you confidently teach or coach? Be as specific as possible.",
    required: true,
  },
  {
    name: "practicalExample",
    label:
      "Describe an example of how you have applied your marketing or business strategy knowledge in a real project or situation.",
    hint: "Personal projects, businesses, school projects and volunteer work all count. You don't need an established business.",
    required: true,
  },
];

export const TEACHING_QUESTIONS: ApplicationQuestion[] = [
  {
    name: "teachingPlan",
    label:
      "If you were teaching a beginner a useful skill in your area of expertise, what would you teach? How would you explain it?",
    required: true,
  },
  {
    name: "feedbackApproach",
    label:
      "A member shares a business idea with real problems. How would you give honest feedback while keeping them encouraged?",
    required: true,
  },
  {
    name: "availability",
    label: "What is your general availability? Include days, times and your time zone.",
    required: true,
    rows: 3,
  },
  {
    name: "motivation",
    label:
      "Why do you want to coach at Ventrio, and how do you connect with its values of faith, business and impact?",
    required: true,
  },
];

export const AGREEMENTS = [
  { name: "agreeExpectations", label: "I have read the coach expectations and agree to follow them." },
  {
    name: "agreeNoGuarantees",
    label: "I will never guarantee profits or promise business success to members.",
  },
  {
    name: "agreeSafeguarding",
    label:
      "I understand the community may include teenagers and I will follow Ventrio's conduct and safeguarding policies.",
  },
  { name: "agreeAccurate", label: "The information in this application is accurate." },
];

export function getCalendlyUrl(): string {
  return process.env.CALENDLY_URL?.trim() || "https://calendly.com/dev-jake317/30min";
}

// Applicants who weren't selected can apply again this many days after the decision.
export const REAPPLY_DAYS = 3;

export function reapplyOpensAt(application: { status: string; decidedAt: Date | null; updatedAt: Date }): Date | null {
  if (application.status !== "NOT_SELECTED") {
    return null;
  }

  return new Date((application.decidedAt ?? application.updatedAt).getTime() + REAPPLY_DAYS * 86400000);
}
