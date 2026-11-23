import type { ProgressType } from "../types";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const MS_PER_SECOND = 1000;

/**
 * How much progress counts as one "due" step for each way of tracking, and how
 * it reads in "next ___ due" (label), "___ every" (paceLabel) and
 * "___ left today" (amountLabel).
 */
const DUE_UNIT: Record<ProgressType, { size: number; label: string; paceLabel: string; amountLabel: string }> = {
  page: { size: 1, label: "page", paceLabel: "1 page", amountLabel: "pages" },
  location: { size: 100, label: "100 locations", paceLabel: "100 locations", amountLabel: "locations" },
  percentage: { size: 1, label: "1%", paceLabel: "1%", amountLabel: "percent" },
};

/** Seconds as HH:MM:SS, whole seconds only, never negative. */
export function formatCountdown(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / SECONDS_PER_HOUR);
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const secs = total % SECONDS_PER_MINUTE;
  return [hours, minutes, secs].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Seconds from `now` until `endHour`:00 today (local time); zero once it has passed. */
export function secondsUntilEndOfDay({ now, endHour }: { now: Date; endHour: number }): number {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, 0, 0, 0);
  return Math.max(0, (end.getTime() - now.getTime()) / MS_PER_SECOND);
}

/**
 * Time remaining today spread evenly over the units still to read for today's
 * goal: how long each page (or 1%, or 100 locations) has. Null when the goal is met.
 */
export function secondsPerUnitDue({
  secondsLeft,
  remaining,
  progressType,
}: {
  secondsLeft: number;
  remaining: number;
  progressType: ProgressType;
}): number | null {
  const units = remaining / DUE_UNIT[progressType].size;
  if (units <= 0) return null;
  return secondsLeft / units;
}

/** One step phrased as an amount, e.g. "1 page" or "100 locations". */
export function paceUnitLabel(progressType: ProgressType): string {
  return DUE_UNIT[progressType].paceLabel;
}

/** The book's unit as a plural amount, e.g. "pages" or "percent". */
export function amountUnitLabel(progressType: ProgressType): string {
  return DUE_UNIT[progressType].amountLabel;
}

/** What one "due" step is called, e.g. "page" or "100 locations". */
export function dueUnitLabel(progressType: ProgressType): string {
  return DUE_UNIT[progressType].label;
}

/**
 * When the next unit is due if the reader keeps an even pace from `now` to the
 * end of the reading day. Null when today's goal is met.
 */
export function nextDueDeadline({
  now,
  endHour,
  remaining,
  progressType,
}: {
  now: Date;
  endHour: number;
  remaining: number;
  progressType: ProgressType;
}): Date | null {
  const secondsLeft = secondsUntilEndOfDay({ now, endHour });
  const perUnit = secondsPerUnitDue({ secondsLeft, remaining, progressType });
  if (perUnit === null) return null;
  return new Date(now.getTime() + perUnit * MS_PER_SECOND);
}
