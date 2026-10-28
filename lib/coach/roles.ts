import { splitIds } from "@/lib/coach/rules";

// Discord server roles that unlock the coach dashboard. Override with COACH_ROLE_IDS.
export const DEFAULT_COACH_ROLE_IDS = ["1560107594020814888", "1560110258217558068", "1560110027262525450"];

export function getCoachRoleIds(): string[] {
  const configured = splitIds(process.env.COACH_ROLE_IDS);

  return configured.length > 0 ? configured : DEFAULT_COACH_ROLE_IDS;
}

export function getLeadershipRoleIds(): string[] {
  return splitIds(process.env.LEADERSHIP_ROLE_IDS);
}
