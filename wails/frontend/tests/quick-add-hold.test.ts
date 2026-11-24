import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import QuickAddTile from "../src/lib/components/QuickAddTile.svelte";
import BookCard from "../src/lib/components/BookCard.svelte";
import type { Book, UserSettings } from "../src/lib/types";
import { HOLD_DELAY_MS } from "../src/lib/services/holdRepeat";

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

function renderTile({ maxAdd, repeatOnHold = true }: { maxAdd?: number; repeatOnHold?: boolean } = {}) {
  const onAdd = vi.fn();
  const onRemove = vi.fn();
  const result = render(QuickAddTile, {
    props: { label: "+1 location", unit: "location", onAdd, onRemove, maxAdd, repeatOnHold },
  });
  const tile = result.getByRole("button", { name: "+1 location" });
  const badge = () => result.container.querySelector(".burst")?.textContent;
  /** A mouse release: pointerup, then the click the browser fires after it. */
  async function release() {
    await fireEvent.pointerUp(tile);
    await fireEvent.click(tile);
  }
  return { ...result, onAdd, onRemove, tile, badge, release };
}

// Locations come in the hundreds, so tapping +1 for each is impractical.
// Holding the tile keeps adding, faster the longer it's held, and the total
// is saved once on release.
describe("QuickAddTile hold to repeat", () => {
  it("adds just one for a press shorter than the pause", async () => {
    const { tile, onAdd, release } = renderTile();
    await fireEvent.pointerDown(tile, { button: 0 });
    advance(HOLD_DELAY_MS - 100);
    await release();
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(1);
  });

  it("starts adding after the pause and saves the held total once on release", async () => {
    const { tile, onAdd, badge, release } = renderTile();
    await fireEvent.pointerDown(tile, { button: 0 });
    advance(HOLD_DELAY_MS + 2000);
    const shown = Number(badge()?.replace("+", ""));
    expect(shown).toBeGreaterThan(1);
    expect(onAdd).not.toHaveBeenCalled();
    await release();
    // The click that follows the release must not add an extra 1.
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(shown);
  });

  it("speeds up the longer it is held", async () => {
    const { tile, badge } = renderTile();
    const count = () => Number(badge()?.replace("+", "") ?? 0);
    await fireEvent.pointerDown(tile, { button: 0 });
    advance(HOLD_DELAY_MS);
    const atStart = count();
    advance(1000);
    const firstSecond = count() - atStart;
    advance(3000);
    const beforeLater = count();
    advance(1000);
    const laterSecond = count() - beforeLater;
    expect(firstSecond).toBeGreaterThan(0);
    expect(firstSecond).toBeLessThanOrEqual(10);
    expect(laterSecond).toBeGreaterThanOrEqual(5 * firstSecond);
  });

  it("stops at the most that can still be added", async () => {
    const { tile, onAdd, badge, release } = renderTile({ maxAdd: 12 });
    await fireEvent.pointerDown(tile, { button: 0 });
    advance(HOLD_DELAY_MS + 10_000);
    expect(badge()).toBe("+12");
    await release();
    expect(onAdd).toHaveBeenCalledWith(12);
  });

  // Dragging off the tile or the system cancelling the press still keeps
  // what was counted rather than silently dropping it.
  it("saves the held total when the press is cancelled", async () => {
    const { tile, onAdd } = renderTile();
    await fireEvent.pointerDown(tile, { button: 0 });
    advance(HOLD_DELAY_MS + 500);
    await fireEvent.pointerCancel(tile);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0]).toBeGreaterThan(1);
  });

  // Pages and percent are logged a few at a time, so there a hold is just a press.
  it("adds just one for a long press when holding isn't enabled (pages, percent)", async () => {
    const { tile, onAdd, release } = renderTile({ repeatOnHold: false });
    await fireEvent.pointerDown(tile, { button: 0 });
    advance(HOLD_DELAY_MS + 3000);
    await release();
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(1);
  });

  it("stops counting once released", async () => {
    const { tile, onAdd, release } = renderTile();
    await fireEvent.pointerDown(tile, { button: 0 });
    advance(HOLD_DELAY_MS + 500);
    await release();
    advance(5000);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});

describe("BookCard hold on the +1 tile", () => {
  const settings: UserSettings = { id: 1, reading_start_hour: 8, reading_end_hour: 20, stats_start_date: null };
  const book: Book = {
    id: "book-1",
    title: "Test Book",
    author: null,
    current_progress: 1000,
    total_progress: 1010,
    progress_type: "location",
    target_date: null,
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
  };

  it("only repeats on location books", async () => {
    const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
    const { getByRole } = render(BookCard, {
      props: { book: { ...book, progress_type: "page" }, settings, onEdit: vi.fn(), onDelete: vi.fn(), onProgressUpdate },
    });
    const tile = getByRole("button", { name: "+1 page" });
    await fireEvent.pointerDown(tile, { button: 0 });
    advance(HOLD_DELAY_MS + 3000);
    await fireEvent.pointerUp(tile);
    await fireEvent.click(tile);
    expect(onProgressUpdate).toHaveBeenCalledTimes(1);
    expect(onProgressUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "book-1" }), 1001);
  });

  it("logs the whole held amount as one update, capped at the book's end", async () => {
    const onProgressUpdate = vi.fn().mockResolvedValue(undefined);
    const { getByRole } = render(BookCard, {
      props: { book, settings, onEdit: vi.fn(), onDelete: vi.fn(), onProgressUpdate },
    });
    const tile = getByRole("button", { name: "+1 location" });
    await fireEvent.pointerDown(tile, { button: 0 });
    advance(HOLD_DELAY_MS + 10_000);
    await fireEvent.pointerUp(tile);
    await fireEvent.click(tile);
    expect(onProgressUpdate).toHaveBeenCalledTimes(1);
    expect(onProgressUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "book-1" }), 1010);
  });
});
