import { describe, expect, it } from "vitest";
import type { Book } from "../src/lib/types";
import { sortReadingBooks } from "../src/lib/services/sorting";

function book(id: string, overrides: Partial<Book> = {}): Book {
  return {
    id,
    title: `Book ${id}`,
    author: null,
    current_progress: 10,
    total_progress: 100,
    progress_type: "page",
    target_date: null,
    completed_at: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const ids = (books: Book[]) => books.map((b) => b.id);
const noDeadlines = () => null;

describe("sortReadingBooks", () => {
  // Custom order is the hand-arranged one; sorting must not disturb it.
  it("keeps the given order for Custom", () => {
    const books = [book("b"), book("a"), book("c")];
    const sorted = sortReadingBooks(books, {
      config: { field: "custom", direction: "asc" },
      nextDueAt: noDeadlines,
    });
    expect(ids(sorted)).toEqual(["b", "a", "c"]);
  });

  it("sorts by title, honoring direction", () => {
    const books = [book("b", { title: "Middlemarch" }), book("a", { title: "Emma" }), book("c", { title: "Ulysses" })];
    const asc = sortReadingBooks(books, { config: { field: "title", direction: "asc" }, nextDueAt: noDeadlines });
    const desc = sortReadingBooks(books, { config: { field: "title", direction: "desc" }, nextDueAt: noDeadlines });
    expect(ids(asc)).toEqual(["a", "b", "c"]);
    expect(ids(desc)).toEqual(["c", "b", "a"]);
  });

  it("sorts by date added", () => {
    const books = [
      book("mid", { created_at: "2026-02-01T00:00:00Z" }),
      book("old", { created_at: "2026-01-01T00:00:00Z" }),
      book("new", { created_at: "2026-03-01T00:00:00Z" }),
    ];
    const sorted = sortReadingBooks(books, { config: { field: "created_at", direction: "desc" }, nextDueAt: noDeadlines });
    expect(ids(sorted)).toEqual(["new", "mid", "old"]);
  });

  // Progress compares how far through each book is, not raw page counts.
  it("sorts by fraction read", () => {
    const books = [
      book("half", { current_progress: 50, total_progress: 100 }),
      book("tenth", { current_progress: 100, total_progress: 1000 }),
      book("most", { current_progress: 90, total_progress: 100 }),
    ];
    const sorted = sortReadingBooks(books, { config: { field: "progress", direction: "asc" }, nextDueAt: noDeadlines });
    expect(ids(sorted)).toEqual(["tenth", "half", "most"]);
  });

  // A book with no target date has nothing to compare, so it never jumps
  // ahead of dated books whichever way the list runs.
  it("sorts by target date with undated books last in both directions", () => {
    const books = [
      book("none", { target_date: null }),
      book("late", { target_date: "2026-12-20" }),
      book("soon", { target_date: "2026-12-01" }),
    ];
    const asc = sortReadingBooks(books, { config: { field: "target_date", direction: "asc" }, nextDueAt: noDeadlines });
    const desc = sortReadingBooks(books, { config: { field: "target_date", direction: "desc" }, nextDueAt: noDeadlines });
    expect(ids(asc)).toEqual(["soon", "late", "none"]);
    expect(ids(desc)).toEqual(["late", "soon", "none"]);
  });

  // Ascending puts the most urgent book on top. A book whose goal is met
  // today has no next page due, so it sinks to the bottom either way.
  it("sorts by when the next page is due, goal-met books last", () => {
    const deadlines: Record<string, Date | null> = {
      met: null,
      later: new Date("2026-11-24T15:30:00Z"),
      sooner: new Date("2026-11-24T15:05:00Z"),
    };
    const books = [book("met"), book("later"), book("sooner")];
    const nextDueAt = (b: Book) => deadlines[b.id];
    const asc = sortReadingBooks(books, { config: { field: "next_due", direction: "asc" }, nextDueAt });
    const desc = sortReadingBooks(books, { config: { field: "next_due", direction: "desc" }, nextDueAt });
    expect(ids(asc)).toEqual(["sooner", "later", "met"]);
    expect(ids(desc)).toEqual(["later", "sooner", "met"]);
  });

  // Ties keep the reader's custom order rather than shuffling arbitrarily.
  it("breaks ties by the incoming order", () => {
    const books = [book("x", { title: "Same" }), book("y", { title: "Same" }), book("z", { title: "Same" })];
    const sorted = sortReadingBooks(books, { config: { field: "title", direction: "desc" }, nextDueAt: noDeadlines });
    expect(ids(sorted)).toEqual(["x", "y", "z"]);
  });

  it("does not mutate the input list", () => {
    const books = [book("b", { title: "B" }), book("a", { title: "A" })];
    sortReadingBooks(books, { config: { field: "title", direction: "asc" }, nextDueAt: noDeadlines });
    expect(ids(books)).toEqual(["b", "a"]);
  });
});
