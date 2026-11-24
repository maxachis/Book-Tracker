import type { DailyGoal, ProgressType } from "../types";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const MS_PER_SECOND = 1000;

/** Locations per "due" step until the reader picks another in Settings. */
export const DEFAULT_LOCATION_STEP = 100;

/** A book's tracking type plus the reader's location step: enough to say what one "due" step is. */
export interface StepUnit {
  progressType: ProgressType;
  /** Locations per step (Settings); pages and percent always step by 1. */
  locationStep: number;
}

interface DueUnit {
  size: number;
  /** "next ___ due" */
  label: string;
  /** "___ every" */
  paceLabel: string;
}

function locationsPhrase(count: number): string {
  return count === 1 ? "1 location" : `${count} locations`;
}

/** How much progress counts as one "due" step, and how it reads. */
function dueUnit({ progressType, locationStep }: StepUnit): DueUnit {
  switch (progressType) {
    case "page":
      return { size: 1, label: "page", paceLabel: "1 page" };
    case "percentage":
      return { size: 1, label: "1%", paceLabel: "1%" };
    case "location":
      return {
        size: locationStep,
        label: locationStep === 1 ? "location" : locationsPhrase(locationStep),
        paceLabel: locationsPhrase(locationStep),
      };
  }
}

/** How "___ left today" names each tracking type's amount. */
const AMOUNT_LABEL: Record<ProgressType, string> = {
  page: "pages",
  location: "locations",
  percentage: "percent",
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
 * goal: how long each page (or 1%, or step of locations) has. Null when the goal is met.
 */
export function secondsPerUnitDue({
  secondsLeft,
  remaining,
  ...unit
}: StepUnit & {
  secondsLeft: number;
  remaining: number;
}): number | null {
  const units = remaining / dueUnit(unit).size;
  if (units <= 0) return null;
  return secondsLeft / units;
}

/** One step phrased as an amount, e.g. "1 page" or "250 locations". */
export function paceUnitLabel(unit: StepUnit): string {
  return dueUnit(unit).paceLabel;
}

/** The book's unit as a plural amount, e.g. "pages" or "percent". */
export function amountUnitLabel(progressType: ProgressType): string {
  return AMOUNT_LABEL[progressType];
}

/** What one "due" step is called, e.g. "page" or "250 locations". */
export function dueUnitLabel(unit: StepUnit): string {
  return dueUnit(unit).label;
}

/**
 * The next mark to reach today: whole "due" steps counted from the goal's
 * start (every page; every location step), capped at the goal's end. Logging
 * part of a step leaves the mark where it is. Null once the goal is met.
 */
export function nextCheckpoint({
  current,
  goal,
  ...unit
}: StepUnit & {
  current: number;
  goal: DailyGoal;
}): number | null {
  if (current >= goal.end) return null;
  const size = dueUnit(unit).size;
  const stepsDone = Math.max(0, Math.floor((current - goal.start) / size));
  return Math.min(goal.start + (stepsDone + 1) * size, goal.end);
}

/**
 * When the next checkpoint is due if the reader keeps an even pace from `now`
 * to the end of the reading day: the time per step, scaled by how much of a
 * step is left to the checkpoint. Null when today's goal is met.
 */
export function nextDueDeadline({
  now,
  endHour,
  current,
  goal,
  ...unit
}: StepUnit & {
  now: Date;
  endHour: number;
  current: number;
  goal: DailyGoal;
}): Date | null {
  const checkpoint = nextCheckpoint({ current, goal, ...unit });
  if (checkpoint === null) return null;
  const secondsLeft = secondsUntilEndOfDay({ now, endHour });
  const perUnit = secondsPerUnitDue({ secondsLeft, remaining: goal.end - current, ...unit });
  if (perUnit === null) return null;
  const stepsToCheckpoint = (checkpoint - current) / dueUnit(unit).size;
  return new Date(now.getTime() + perUnit * stepsToCheckpoint * MS_PER_SECOND);
}
