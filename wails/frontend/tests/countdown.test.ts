import { describe, expect, it } from "vitest";
import {
  formatCountdown,
  secondsUntilEndOfDay,
  secondsPerUnitDue,
  dueUnitLabel,
  nextDueDeadline,
  nextCheckpoint,
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
// Locations are counted in blocks of the chosen step (100 by default);
// percentage in whole percent.
describe("secondsPerUnitDue", () => {
  it("spreads the remaining time across the pages left", () => {
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: 10, progressType: "page", locationStep: 100 })).toBe(360);
  });

  it("counts locations in blocks of 100", () => {
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: 250, progressType: "location", locationStep: 100 })).toBe(1440);
  });

  // The reader picks the location step in Settings; 100 is only the default.
  it("counts locations in blocks of the chosen step", () => {
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: 500, progressType: "location", locationStep: 250 })).toBe(1800);
  });

  it("counts percentage in whole percent", () => {
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: 4, progressType: "percentage", locationStep: 100 })).toBe(900);
  });

  it("has nothing due once today's goal is met", () => {
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: 0, progressType: "page", locationStep: 100 })).toBeNull();
    expect(secondsPerUnitDue({ secondsLeft: 3600, remaining: -3, progressType: "page", locationStep: 100 })).toBeNull();
  });
});

// The next mark to reach: whole steps of the book's unit counted from where
// today's goal started, so a few locations in doesn't move the mark.
describe("nextCheckpoint", () => {
  it.each([
    ["page", 100, { start: 90, end: 110 }, 101],
    ["location", 100, { start: 90, end: 300 }, 190],
    ["location", 189, { start: 90, end: 300 }, 190],
    ["location", 190, { start: 90, end: 300 }, 290],
    ["location", 250, { start: 90, end: 300 }, 290],
    // The last stretch is shorter than a full step; the goal's end caps it.
    ["location", 295, { start: 90, end: 300 }, 300],
  ] as const)("for a %s book at %i (goal %o) is %i", (progressType, current, goal, expected) => {
    expect(nextCheckpoint({ current, goal, progressType, locationStep: 100 })).toBe(expected);
  });

  it("steps locations by the chosen step, counted from the goal's start", () => {
    const goal = { start: 90, end: 1000 };
    expect(nextCheckpoint({ current: 100, goal, progressType: "location", locationStep: 250 })).toBe(340);
    expect(nextCheckpoint({ current: 340, goal, progressType: "location", locationStep: 250 })).toBe(590);
  });

  // The step only means something for locations; pages and percent stay at 1.
  it("ignores the location step for pages and percent", () => {
    const goal = { start: 90, end: 1000 };
    expect(nextCheckpoint({ current: 100, goal, progressType: "page", locationStep: 250 })).toBe(101);
    expect(nextCheckpoint({ current: 100, goal, progressType: "percentage", locationStep: 250 })).toBe(101);
  });

  it("is null once today's goal is met", () => {
    expect(nextCheckpoint({ current: 300, goal: { start: 90, end: 300 }, progressType: "location", locationStep: 100 })).toBeNull();
  });
});

// When the next checkpoint is due if the reader keeps an even pace from now.
describe("nextDueDeadline", () => {
  const now = new Date(2026, 10, 23, 20, 0, 0); // 2h before a 10 PM end

  it("is one pace-interval from now for pages", () => {
    const due = nextDueDeadline({ now, endHour: 22, current: 100, goal: { start: 100, end: 110 }, progressType: "page", locationStep: 100 });
    expect(due).toEqual(new Date(2026, 10, 23, 20, 12, 0)); // 2h / 10 pages
  });

  // 200 locations left = 2 steps of 100, so 1h each; the checkpoint (190)
  // is 0.9 of a step away, so it's due in 54 minutes.
  it("covers only the part of a location step still to read", () => {
    const due = nextDueDeadline({ now, endHour: 22, current: 100, goal: { start: 90, end: 300 }, progressType: "location", locationStep: 100 });
    expect(due).toEqual(new Date(2026, 10, 23, 20, 54, 0));
  });

  it("is null once today's goal is met", () => {
    expect(nextDueDeadline({ now, endHour: 22, current: 110, goal: { start: 100, end: 110 }, progressType: "page", locationStep: 100 })).toBeNull();
  });
});

describe("paceUnitLabel", () => {
  it.each([
    ["page", "1 page"],
    ["location", "100 locations"],
    ["percentage", "1%"],
  ] as const)("phrases one %s step as %s", (progressType, expected) => {
    expect(paceUnitLabel({ progressType, locationStep: 100 })).toBe(expected);
  });
});

describe("location step labels", () => {
  it("name the chosen step", () => {
    expect(paceUnitLabel({ progressType: "location", locationStep: 250 })).toBe("250 locations");
    expect(dueUnitLabel({ progressType: "location", locationStep: 250 })).toBe("250 locations");
  });

  it("use the singular for a step of one", () => {
    expect(dueUnitLabel({ progressType: "location", locationStep: 1 })).toBe("location");
    expect(paceUnitLabel({ progressType: "location", locationStep: 1 })).toBe("1 location");
  });
});

describe("dueUnitLabel", () => {
  it.each([
    ["page", "page"],
    ["location", "100 locations"],
    ["percentage", "1%"],
  ] as const)("names the %s unit as %s", (progressType, expected) => {
    expect(dueUnitLabel({ progressType, locationStep: 100 })).toBe(expected);
  });
});
