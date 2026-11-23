import { describe, expect, it } from "vitest";
import {
  formatCountdown,
  secondsUntilEndOfDay,
  secondsPerUnitDue,
  dueUnitLabel,
  nextDueDeadline,
  paceUnitLabel,
} from "../src/lib/services/countdown";

describe("formatCountdown", () => {
  it.each([
    [0, "00:00:00"],
    [59, "00:00:59"],
    [3661, "01:01:01"],
    [14 * 3600, "14:00:00"],
  ])("shows %i seconds as %s", (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected);
  });

  // A countdown only ever shows whole seconds remaining, never rounds up.
  it("drops fractions of a second", () => {
    expect(formatCountdown(59.9)).toBe("00:00:59");
  });

  it("never shows a negative time", () => {
    expect(formatCountdown(-5)).toBe("00:00:00");
  });
});

describe("secondsUntilEndOfDay", () => {
  it("counts down to the reading end hour, local time", () => {
    expect(secondsUntilEndOfDay({ now: new Date(2026, 10, 23, 21, 0, 0), endHour: 22 })).toBe(3600);
    expect(secondsUntilEndOfDay({ now: new Date(2026, 10, 23, 21, 59, 30), endHour: 22 })).toBe(30);
  });

  it("is zero once the reading day has ended", () => {
    expect(secondsUntilEndOfDay({ now: new Date(2026, 10, 23, 22, 0, 0), endHour: 22 })).toBe(0);
    expect(secondsUntilEndOfDay({ now: new Date(2026, 10, 23, 23, 15, 0), endHour: 22 })).toBe(0);
  });

  it("includes milliseconds so the countdown ticks over on the second", () => {
    expect(secondsUntilEndOfDay({ now: new Date(2026, 10, 23, 21, 59, 59, 500), endHour: 22 })).toBe(0.5);
  });
});

// Time remaining today divided by the units still to read for today's goal.
// Locations are counted in blocks of 100; percentage in whole percent.
describe("secondsPerUnitDue", () => {
  it("spreads the remaining time across the pages left", () => {
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: 10, progressType: "page" })).toBe(360);
  });

  it("counts locations in blocks of 100", () => {
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: 250, progressType: "location" })).toBe(1440);
  });

  it("counts percentage in whole percent", () => {
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: 4, progressType: "percentage" })).toBe(900);
  });

  it("has nothing due once today's goal is met", () => {
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: 0, progressType: "page" })).toBeNull();
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: -3, progressType: "page" })).toBeNull();
  });
});

// The moment the next unit is due if the reader keeps an even pace from now.
describe("nextDueDeadline", () => {
  it("is one pace-interval from now", () => {
    const now = new Date(2026, 10, 23, 20, 0, 0);
    const due = nextDueDeadline({ now, endHour: 22, remaining: 10, progressType: "page" });
    expect(due).toEqual(new Date(2026, 10, 23, 20, 12, 0)); // 2h / 10 pages
  });

  it("is null once today's goal is met", () => {
    const now = new Date(2026, 10, 23, 20, 0, 0);
    expect(nextDueDeadline({ now, endHour: 22, remaining: 0, progressType: "page" })).toBeNull();
  });
});

describe("paceUnitLabel", () => {
  it.each([
    ["page", "1 page"],
    ["location", "100 locations"],
    ["percentage", "1%"],
  ] as const)("phrases one %s step as %s", (progressType, expected) => {
    expect(paceUnitLabel(progressType)).toBe(expected);
  });
});

describe("dueUnitLabel", () => {
  it.each([
    ["page", "page"],
    ["location", "100 locations"],
    ["percentage", "1%"],
  ] as const)("names the %s unit as %s", (progressType, expected) => {
    expect(dueUnitLabel(progressType)).toBe(expected);
  });
});
