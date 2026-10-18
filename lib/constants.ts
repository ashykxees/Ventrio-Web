type Option = {
  value: string;
  label: string;
};

export const CONTENT_STATUSES: Option[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export const EVENT_STATUSES: Option[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ARCHIVED", label: "Archived" },
];

export const EVENT_TYPES: Option[] = [
  { value: "CLASS", label: "Class" },
  { value: "COACHING", label: "Coaching Call" },
  { value: "NETWORKING", label: "Networking" },
  { value: "FAITH", label: "Faith Session" },
  { value: "PITCH", label: "Pitch Competition" },
  { value: "OTHER", label: "Other" },
];

export const EVENT_FORMATS: Option[] = [
  { value: "ONLINE", label: "Online" },
  { value: "IN_PERSON", label: "In person" },
  { value: "HYBRID", label: "Hybrid" },
];

export const REGISTRATION_MODES: Option[] = [
  { value: "NONE", label: "No registration needed" },
  { value: "SITE", label: "Register on Ventrio" },
  { value: "EXTERNAL", label: "External registration link" },
];

export const LESSON_TYPES: Option[] = [
  { value: "LESSON", label: "Lesson" },
  { value: "CLASS", label: "Class" },
  { value: "RESOURCE", label: "Resource" },
  { value: "COACHING", label: "Coaching" },
];

export const LESSON_CATEGORIES: Option[] = [
  { value: "ENTREPRENEURSHIP", label: "Entrepreneurship" },
  { value: "MARKETING", label: "Marketing" },
  { value: "BRANDING", label: "Branding" },
  { value: "SALES", label: "Sales" },
  { value: "LEADERSHIP", label: "Leadership" },
  { value: "AI_TECH", label: "AI & Technology" },
  { value: "FAITH", label: "Faith & Purpose" },
];

export const LESSON_REGISTRATION: Option[] = [
  { value: "NOT_REQUIRED", label: "No registration needed" },
  { value: "OPEN", label: "Registration open" },
  { value: "CLOSED", label: "Registration closed" },
];

export const COMPETITION_PHASES: Option[] = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "OPEN", label: "Open" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "COMPLETED", label: "Completed" },
];

export const SUBMISSION_STATUSES: Option[] = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "FINALIST", label: "Finalist" },
  { value: "WINNER", label: "Winner" },
  { value: "NOT_SELECTED", label: "Not selected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export const TIMEZONES: Option[] = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Berlin", label: "Central Europe (Berlin)" },
  { value: "Africa/Lagos", label: "West Africa (Lagos)" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "UTC", label: "UTC" },
];

export function labelFor(options: Option[], value: string | null | undefined): string {
  return options.find((option) => option.value === value)?.label ?? value ?? "";
}

export function valuesOf(options: Option[]): [string, ...string[]] {
  return options.map((option) => option.value) as [string, ...string[]];
}
