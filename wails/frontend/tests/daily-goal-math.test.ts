import { describe, expect, it } from "vitest";
import { defaultDailyGoal, dailyGoalPercentage } from "../src/lib/services/calculations";
import type { Book, UserSettings } from "../src/lib/types";

function createBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    title: "Test Book",
    author: null,
    current_progress: 10,
    total_progress: 100,
    progress_type: "page",
    target_date: null,
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

const settings: UserSettings = {
  id: 1,
  reading_start_hour: 8,
  reading_end_hour: 20,
  stats_start_date: null,
};

// The sidebar shows a daily-goal bar for every book, including ones whose
// card has never been opened, so the default goal must be computable
// without mounting a card.
describe("defaultDailyGoal", () => {
  it("starts at current progress and, with no target date, aims for 10% of what remains", () => {
    const goal = defaultDailyGoal(createBook({ current_progress: 10, total_progress: 100 }), settings);
    expect(goal).toEqual({ start: 10, end: 19 });
  });

  it("never sets the end past the book's total", () => {
    const goal = defaultDailyGoal(createBook({ current_progress: 99, total_progress: 100 }), settings);
    expect(goal.end).toBe(100);
  });

  it("uses the pages-per-day pace when a target date is set", () => {
    const target = new Date();
    target.setDate(target.getDate() + 9); // 10 reading days including today
    const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
    const goal = defaultDailyGoal(
      createBook({ current_progress: 0, total_progress: 100, target_date: iso }),
      settings
    );
    expect(goal).toEqual({ start: 0, end: 10 });
  });
});

describe("dailyGoalPercentage", () => {
  it("reports how far through today's range the reader is", () => {
    expect(dailyGoalPercentage(125, { start: 100, end: 150 })).toBe(50);
  });

  it("caps at 100 when the reader has gone past the goal", () => {
    expect(dailyGoalPercentage(175, { start: 100, end: 150 })).toBe(100);
  });

  it("floors at 0 when progress is behind the goal's start", () => {
    expect(dailyGoalPercentage(90, { start: 100, end: 150 })).toBe(0);
  });

  it("treats an empty range as already complete", () => {
    expect(dailyGoalPercentage(100, { start: 100, end: 100 })).toBe(100);
  });
});
