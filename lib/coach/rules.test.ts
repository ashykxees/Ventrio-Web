import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  hasAnyRole,
  isoWeekKey,
  parseMoneyToCents,
  REQUEST_COACH_TRANSITIONS,
  REQUEST_LEADERSHIP_TRANSITIONS,
  SUBMISSION_LEADERSHIP_TRANSITIONS,
  splitIds,
  TASK_COACH_TRANSITIONS,
  weekStartUtc,
} from "./rules.ts";

test("ISO week keys respect the session time zone", () => {
  // Monday 2026-10-19 02:00 UTC is still Sunday evening in New York (week 42).
  const date = new Date("2026-10-19T02:00:00Z");

  assert.equal(isoWeekKey(date, "UTC"), "2026-W43");
  assert.equal(isoWeekKey(date, "America/New_York"), "2026-W42");
  assert.equal(isoWeekKey(new Date("2027-01-01T12:00:00Z"), "UTC"), "2026-W53");
});

test("week start is the Monday of the ISO week", () => {
  assert.equal(weekStartUtc("2026-W43").toISOString().slice(0, 10), "2026-10-19");
});

test("money parsing rejects invalid amounts", () => {
  assert.equal(parseMoneyToCents("$24.50"), 2450);
  assert.equal(parseMoneyToCents("20"), 2000);
  assert.equal(parseMoneyToCents("-5"), null);
  assert.equal(parseMoneyToCents("1.234"), null);
  assert.equal(parseMoneyToCents("abc"), null);
});

test("coaches cannot approve or reject their own requests", () => {
  for (const from of Object.keys(REQUEST_COACH_TRANSITIONS)) {
    assert.equal(canTransition(REQUEST_COACH_TRANSITIONS, from, "APPROVED"), false);
    assert.equal(canTransition(REQUEST_COACH_TRANSITIONS, from, "REJECTED"), false);
  }

  assert.equal(canTransition(REQUEST_LEADERSHIP_TRANSITIONS, "SUBMITTED", "APPROVED"), true);
  assert.equal(canTransition(REQUEST_LEADERSHIP_TRANSITIONS, "APPROVED", "REJECTED"), false);
});

test("coaches cannot mark their own tasks completed", () => {
  for (const from of Object.keys(TASK_COACH_TRANSITIONS)) {
    assert.equal(canTransition(TASK_COACH_TRANSITIONS, from, "COMPLETED"), false);
  }
});

test("approved project work cannot be re-decided", () => {
  assert.equal(canTransition(SUBMISSION_LEADERSHIP_TRANSITIONS, "APPROVED", "APPROVED"), false);
  assert.equal(canTransition(SUBMISSION_LEADERSHIP_TRANSITIONS, "APPROVED", "REJECTED"), false);
});

test("role checks need an exact role ID match", () => {
  const allowed = splitIds("1560107594020814888, 1560110258217558068 1560110027262525450");

  assert.equal(allowed.length, 3);
  assert.equal(hasAnyRole(["1560110258217558068"], allowed), true);
  assert.equal(hasAnyRole(["156011025821755806"], allowed), false);
  assert.equal(hasAnyRole([], allowed), false);
  assert.deepEqual(splitIds("not-an-id, 123"), []);
});
