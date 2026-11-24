import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import QuickAddTile from "../src/lib/components/QuickAddTile.svelte";
import ProgressBar from "../src/lib/components/ProgressBar.svelte";
import BumpNumber from "../src/lib/components/BumpNumber.svelte";
import BookCard from "../src/lib/components/BookCard.svelte";
import type { Book, UserSettings } from "../src/lib/types";

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

// Pages are often logged in quick bursts, so feedback has to stay light and
// sum up the burst rather than pile up one effect per press.
describe("QuickAddTile running count", () => {
  function renderTile() {
    const onAdd = vi.fn();
    const result = render(QuickAddTile, { props: { label: "+1 page", unit: "page", onAdd } });
    const tile = result.getByRole("button", { name: "+1 page" });
    const burst = () => result.container.querySelector(".burst");
    return { ...result, onAdd, tile, burst };
  }

  it("adds one unit per press", async () => {
    const { tile, onAdd } = renderTile();
    await fireEvent.click(tile);
    await fireEvent.click(tile);
    expect(onAdd).toHaveBeenCalledTimes(2);
  });

  it("shows one running count for a burst of presses", async () => {
    const { tile, burst } = renderTile();
    await fireEvent.click(tile);
    await fireEvent.click(tile);
    await fireEvent.click(tile);
    expect(burst()?.textContent).toBe("+3");
    expect(document.querySelectorAll(".burst")).toHaveLength(1);
  });

  it("clears the count a moment after the last press and starts over on the next", async () => {
    const { tile, burst } = renderTile();
    await fireEvent.click(tile);
    await fireEvent.click(tile);
    advance(500);
    expect(burst()?.textContent).toBe("+2"); // still mid-burst
    advance(2000);
    expect(burst()).toBeNull();
    await fireEvent.click(tile);
    expect(burst()?.textContent).toBe("+1");
  });

  it("does not count presses while disabled", async () => {
    const onAdd = vi.fn();
    const { getByRole, container } = render(QuickAddTile, {
      props: { label: "+1 page", unit: "page", onAdd, disabled: true },
    });
    await fireEvent.click(getByRole("button", { name: "+1 page" }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(container.querySelector(".burst")).toBeNull();
  });
});

// The slice of the bar a press just added lights up briefly, tying the press to the progress.
describe("ProgressBar glow on increase", () => {
  const glow = (c: HTMLElement) => c.querySelector<HTMLElement>(".progress-glow");

  it("does not glow when first shown", () => {
    const { container } = render(ProgressBar, { props: { percentage: 10, glowOnIncrease: true } });
    expect(glow(container)).toBeNull();
  });

  it("highlights the slice just added", async () => {
    const { container, rerender } = render(ProgressBar, { props: { percentage: 10, glowOnIncrease: true } });
    await rerender({ percentage: 12, glowOnIncrease: true });
    expect(glow(container)?.style.left).toBe("10%");
    expect(glow(container)?.style.width).toBe("2%");
  });

  it("grows one highlight across a burst, then lets it go", async () => {
    const { container, rerender } = render(ProgressBar, { props: { percentage: 10, glowOnIncrease: true } });
    await rerender({ percentage: 11, glowOnIncrease: true });
    advance(200);
    await rerender({ percentage: 12, glowOnIncrease: true });
    expect(glow(container)?.style.left).toBe("10%");
    expect(glow(container)?.style.width).toBe("2%");
    advance(2000);
    expect(glow(container)).toBeNull();
  });

  it("does not glow when progress goes down or when glowing is off", async () => {
    const down = render(ProgressBar, { props: { percentage: 10, glowOnIncrease: true } });
    await down.rerender({ percentage: 8, glowOnIncrease: true });
    expect(glow(down.container)).toBeNull();
    down.unmount();
    const off = render(ProgressBar, { props: { percentage: 10 } });
    await off.rerender({ percentage: 12 });
    expect(glow(off.container)).toBeNull();
  });
});

describe("BumpNumber", () => {
  it("lifts the number when it changes, but not when first shown", async () => {
    const { container, rerender } = render(BumpNumber, { props: { value: 120 } });
    const num = () => container.querySelector(".bump-number")!;
    expect(num().textContent).toBe("120");
    expect(num().classList.contains("bump")).toBe(false);
    await rerender({ value: 121 });
    expect(num().textContent).toBe("121");
    expect(num().classList.contains("bump")).toBe(true);
  });
});

describe("BookCard +1 feedback", () => {
  const settings: UserSettings = { id: 1, reading_start_hour: 8, reading_end_hour: 20, stats_start_date: null };
  const book: Book = {
    id: "book-1", title: "Dune", author: null, current_progress: 10, total_progress: 100,
    progress_type: "page", target_date: null, completed_at: null, created_at: "2024-01-01T00:00:00Z",
  };

  // After a press, both the overall bar and today's bar light up and both counts lift.
  it("glows both bars and lifts both counts when progress goes up", async () => {
    const { container, rerender } = render(BookCard, {
      props: { book, settings, onDelete: vi.fn(), onProgressUpdate: vi.fn().mockResolvedValue(undefined) },
    });
    await rerender({ book: { ...book, current_progress: 11 } });
    expect(container.querySelector(".panel-overall .progress-glow")).toBeTruthy();
    expect(container.querySelector(".panel-daily .progress-glow")).toBeTruthy();
    expect(container.querySelector(".panel-overall .bump-number.bump")?.textContent).toBe("11");
    expect(container.querySelector(".panel-daily .bump-number.bump")?.textContent).toBe("1");
  });
});
