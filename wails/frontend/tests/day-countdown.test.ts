import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import DayCountdown from "../src/lib/components/DayCountdown.svelte";
import type { Book, ProgressType } from "../src/lib/types";
import { resetDueClock } from "../src/lib/stores/dueClock.svelte";

function makeBook(progressType: ProgressType = "page"): Book {
  return {
    id: "a",
    title: "Dune",
    author: null,
    current_progress: 100,
    total_progress: 600,
    progress_type: progressType,
    target_date: null,
    completed_at: null,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function renderCountdown({ goalEnd, progressType = "page" }: { goalEnd: number; progressType?: ProgressType }) {
  return render(DayCountdown, {
    props: { book: makeBook(progressType), dailyGoal: { start: 90, end: goalEnd }, endHour: 22 },
  });
}

function advanceSeconds(seconds: number) {
  vi.advanceTimersByTime(seconds * 1000);
  flushSync();
}

const paceText = (container: HTMLElement) =>
  container.querySelector('[data-metric="pace"] .countdown-value')?.textContent?.replace(/\s+/g, " ").trim();

const value = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-metric="${name}"] .countdown-value`)?.textContent;

beforeEach(() => {
  resetDueClock();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 23, 20, 0, 0)); // 8:00 PM local
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DayCountdown", () => {
  it("shows the time left until the end of the reading day", () => {
    const { container } = renderCountdown({ goalEnd: 110 });
    expect(value(container, "day-left")).toBe("02:00:00");
  });

  // 2 hours over the 10 pages still needed for today's goal.
  it("shows how long until the next page is due", () => {
    const { container, getByText } = renderCountdown({ goalEnd: 110 });
    expect(value(container, "next-due")).toBe("00:12:00");
    expect(getByText(/next page due/i)).toBeTruthy();
  });

  it("ticks down every second", () => {
    const { container } = renderCountdown({ goalEnd: 110 });
    vi.advanceTimersByTime(1000);
    flushSync();
    expect(value(container, "day-left")).toBe("01:59:59");
    expect(value(container, "next-due")).toBe("00:11:59"); // 7199s / 10 pages
  });

  it("names the unit for locations and percentage", () => {
    const locations = renderCountdown({ goalEnd: 300, progressType: "location" });
    expect(locations.getByText(/next 100 locations due/i)).toBeTruthy();
    locations.unmount();
    const percent = renderCountdown({ goalEnd: 104, progressType: "percentage" });
    expect(percent.getByText(/next 1% due/i)).toBeTruthy();
  });

  it("says the goal is met instead of counting down once today's goal is reached", () => {
    const { container } = renderCountdown({ goalEnd: 100 });
    expect(value(container, "next-due")).toBe("Goal met");
    expect(paceText(container)).toBe("\u2014");
  });

  // The deadline is fixed when set, so it counts down in real time, while the
  // pace beside it is recomputed live and drifts as the day runs out.
  it("counts the next-due deadline down in real time while the pace drifts", () => {
    const { container } = renderCountdown({ goalEnd: 110 });
    expect(paceText(container)).toBe("1 page every 00:12:00");
    advanceSeconds(60);
    expect(value(container, "next-due")).toBe("00:11:00");
    expect(paceText(container)).toBe("1 page every 00:11:54"); // 7140s / 10 pages
  });

  // Missing a deadline doesn't leave it stuck at zero: a new one is set from
  // the time and pages left at that moment.
  it("starts a new countdown when the deadline passes without progress", () => {
    const { container } = renderCountdown({ goalEnd: 110 });
    advanceSeconds(12 * 60);
    expect(value(container, "next-due")).toBe("00:10:48"); // 6480s / 10 pages
  });

  it("starts a new countdown when progress is logged", async () => {
    const { container, rerender } = renderCountdown({ goalEnd: 110 });
    advanceSeconds(60);
    await rerender({ book: { ...makeBook(), current_progress: 101 } });
    flushSync();
    expect(value(container, "next-due")).toBe("00:13:13"); // 7140s / 9 pages
  });

  it("names the unit in the pace", () => {
    const locations = renderCountdown({ goalEnd: 300, progressType: "location" });
    expect(paceText(locations.container)).toMatch(/^100 locations every /);
    locations.unmount();
    const percent = renderCountdown({ goalEnd: 104, progressType: "percentage" });
    expect(paceText(percent.container)).toMatch(/^1% every /);
  });

  // What's still to read for today's goal: the amount the countdowns divide by.
  it("shows how much is left for today's goal, in the book's own unit", () => {
    const { container, getByText } = renderCountdown({ goalEnd: 110 });
    expect(value(container, "remaining")).toBe("10");
    expect(getByText(/pages left today/i)).toBeTruthy();
  });

  it("shows locations and percent remaining as raw amounts", () => {
    const locations = renderCountdown({ goalEnd: 300, progressType: "location" });
    expect(value(locations.container, "remaining")).toBe("200");
    expect(locations.getByText(/locations left today/i)).toBeTruthy();
    locations.unmount();
    const percent = renderCountdown({ goalEnd: 104, progressType: "percentage" });
    expect(value(percent.container, "remaining")).toBe("4");
    expect(percent.getByText(/percent left today/i)).toBeTruthy();
  });

  it("counts down as progress is logged and never goes below zero", async () => {
    const { container, rerender } = renderCountdown({ goalEnd: 110 });
    await rerender({ book: { ...makeBook(), current_progress: 101 } });
    flushSync();
    expect(value(container, "remaining")).toBe("9");
    await rerender({ book: { ...makeBook(), current_progress: 115 } });
    flushSync();
    expect(value(container, "remaining")).toBe("0");
  });

  it("stops the clock when removed", () => {
    const { unmount } = renderCountdown({ goalEnd: 110 });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
