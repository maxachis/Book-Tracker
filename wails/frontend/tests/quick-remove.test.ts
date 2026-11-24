import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import QuickAddTile from "../src/lib/components/QuickAddTile.svelte";
import ProgressBar from "../src/lib/components/ProgressBar.svelte";
import BumpNumber from "../src/lib/components/BumpNumber.svelte";
import BookCard from "../src/lib/components/BookCard.svelte";
import type { Book, UserSettings } from "../src/lib/types";
import { HOLD_DELAY_MS } from "../src/lib/services/holdRepeat";
import { appState } from "../src/lib/stores/state.svelte";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function advance(ms: number) {
  vi.advanceTimersByTime(ms);
  flushSync();
}

// A small -1 under the +1 tile corrects an overshoot without typing in the
// Update box.
describe("QuickAddTile -1", () => {
  function renderTile(props: { removeDisabled?: boolean; maxRemove?: number; repeatOnHold?: boolean } = {}) {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const result = render(QuickAddTile, { props: { label: "+1 page", unit: "page", onAdd, onRemove, ...props } });
    const plus = result.getByRole("button", { name: "+1 page" });
    const minus = result.getByRole("button", { name: "-1 page" });
    const badge = () => result.container.querySelector(".burst")?.textContent;
    return { ...result, onAdd, onRemove, plus, minus, badge };
  }

  it("sits under the +1 tile and removes one per press", async () => {
    const { container, minus, onRemove } = renderTile();
    expect(container.querySelector(".tile-wrap")?.contains(minus)).toBe(true);
    await fireEvent.click(minus);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  // The running count is the net change of the burst, so a correction shows
  // up in the same badge rather than a second one.
  it("shows the net change of a burst in the one running count", async () => {
    const { plus, minus, badge, container } = renderTile();
    await fireEvent.click(plus);
    await fireEvent.click(plus);
    await fireEvent.click(minus);
    expect(badge()).toBe("+1");
    expect(container.querySelectorAll(".burst")).toHaveLength(1);
    await fireEvent.click(minus);
    await fireEvent.click(minus);
    expect(badge()).toBe("−1");
    expect(container.querySelector(".burst")?.classList.contains("negative")).toBe(true);
  });

  it("does nothing while disabled (nothing left to remove)", async () => {
    const { minus, onRemove, badge } = renderTile({ removeDisabled: true });
    expect((minus as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(minus);
    expect(onRemove).not.toHaveBeenCalled();
    expect(badge()).toBeUndefined();
  });

  it("repeats when held if holding is enabled, saving the total once, capped", async () => {
    const { minus, onRemove, badge } = renderTile({ repeatOnHold: true, maxRemove: 15 });
    await fireEvent.pointerDown(minus, { button: 0 });
    advance(HOLD_DELAY_MS + 10_000);
    expect(badge()).toBe("−15");
    await fireEvent.pointerUp(minus);
    await fireEvent.click(minus);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(15);
  });
});

// Taking progress back gets the same feedback as adding it, in reverse.
describe("ProgressBar glow on decrease", () => {
  const glow = (c: HTMLElement) => c.querySelector<HTMLElement>(".progress-glow");

  it("marks the slice just removed", async () => {
    const { container, rerender } = render(ProgressBar, { props: { percentage: 10, glowOnChange: true } });
    await rerender({ percentage: 8, glowOnChange: true });
    expect(glow(container)?.style.left).toBe("8%");
    expect(glow(container)?.style.width).toBe("2%");
    expect(glow(container)?.classList.contains("removed")).toBe(true);
  });
});

describe("BumpNumber on decrease", () => {
  it("dips the number instead of lifting it", async () => {
    const { container, rerender } = render(BumpNumber, { props: { value: 120 } });
    await rerender({ value: 119 });
    const num = container.querySelector(".bump-number")!;
    expect(num.classList.contains("bump-down")).toBe(true);
    expect(num.classList.contains("bump")).toBe(false);
  });
});

describe("BookCard -1", () => {
  const settings: UserSettings = { id: 1, reading_start_hour: 8, reading_end_hour: 20, stats_start_date: null };
  const book: Book = {
    id: "book-1", title: "Dune", author: null, current_progress: 10, total_progress: 100,
    progress_type: "page", target_date: null, completed_at: null, created_at: "2024-01-01T00:00:00Z",
  };
  function renderCard(overrides: Partial<Book> = {}) {
    const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
    const result = render(BookCard, {
      props: { book: { ...book, ...overrides }, settings, onDelete: vi.fn(), onProgressUpdate },
    });
    return { ...result, onProgressUpdate };
  }

  it("lowers progress by one", async () => {
    const { getByRole, onProgressUpdate } = renderCard();
    await fireEvent.click(getByRole("button", { name: "-1 page" }));
    expect(onProgressUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "book-1" }), 9);
  });

  it("is disabled at zero", () => {
    const { getByRole } = renderCard({ current_progress: 0 });
    expect((getByRole("button", { name: "-1 page" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("removes a held amount on location books in one update, never below zero", async () => {
    const { getByRole, onProgressUpdate } = renderCard({ progress_type: "location", current_progress: 8 });
    const minus = getByRole("button", { name: "-1 location" });
    await fireEvent.pointerDown(minus, { button: 0 });
    advance(HOLD_DELAY_MS + 10_000);
    await fireEvent.pointerUp(minus);
    await fireEvent.click(minus);
    expect(onProgressUpdate).toHaveBeenCalledTimes(1);
    expect(onProgressUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "book-1" }), 0);
  });

  it("glows the removed slice on both bars and dips both counts", async () => {
    // Today's goal began at 5, so taking one back from 10 shows on today's bar too.
    appState.dailyGoals = new Map([["book-1", { start: 5, end: 20 }]]);
    const { container, rerender } = renderCard();
    await rerender({ book: { ...book, current_progress: 9 } });
    expect(container.querySelector(".panel-overall .progress-glow.removed")).toBeTruthy();
    expect(container.querySelector(".panel-daily .progress-glow.removed")).toBeTruthy();
    expect(container.querySelector(".panel-overall .bump-number.bump-down")?.textContent).toBe("9");
  });
});
