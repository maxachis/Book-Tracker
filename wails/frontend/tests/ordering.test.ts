import { describe, expect, it } from "vitest";
import { applyCustomOrder, moveItem } from "../src/lib/services/ordering";
import type { Book } from "../src/lib/types";

function book(id: string, created_at: string): Book {
  return {
    id,
    title: id,
    author: null,
    current_progress: 0,
    total_progress: 100,
    progress_type: "page",
    target_date: null,
    completed_at: null,
    created_at,
  };
}

const a = book("a", "2026-01-01T00:00:00Z");
const b = book("b", "2026-02-01T00:00:00Z");
const c = book("c", "2026-03-01T00:00:00Z");

describe("applyCustomOrder", () => {
  it("follows the saved order", () => {
    expect(applyCustomOrder([a, b, c], ["b", "c", "a"]).map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  // Before the reader has ever dragged anything, the list should look the
  // way it always has: newest first.
  it("falls back to newest-first when no order has been saved", () => {
    expect(applyCustomOrder([a, b, c], []).map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  // A just-added book has no saved position; it goes on top so it's visible.
  it("puts books missing from the saved order on top, newest first", () => {
    expect(applyCustomOrder([a, b, c], ["a", "b"]).map((x) => x.id)).toEqual(["c", "a", "b"]);
  });

  it("ignores saved ids for books that are no longer in the list", () => {
    expect(applyCustomOrder([a, b], ["gone", "b", "a"]).map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("moveItem", () => {
  it("moves an item down", () => {
    expect(moveItem(["a", "b", "c", "d"], { from: 0, to: 2 })).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item up", () => {
    expect(moveItem(["a", "b", "c", "d"], { from: 3, to: 1 })).toEqual(["a", "d", "b", "c"]);
  });

  it("clamps a target past either end", () => {
    expect(moveItem(["a", "b", "c"], { from: 0, to: 9 })).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], { from: 2, to: -4 })).toEqual(["c", "a", "b"]);
  });

  it("does not mutate the input", () => {
    const input = ["a", "b", "c"];
    moveItem(input, { from: 0, to: 2 });
    expect(input).toEqual(["a", "b", "c"]);
  });
});
