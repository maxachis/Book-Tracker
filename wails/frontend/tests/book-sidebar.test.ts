import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import BookSidebar from "../src/lib/components/BookSidebar.svelte";
import { formatLocalDate } from "../src/lib/services/dates";
import type { Book, DailyGoal } from "../src/lib/types";

function createBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    title: "Test Book",
    author: "Author",
    current_progress: 50,
    total_progress: 100,
    progress_type: "page",
    target_date: null,
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

const books = [
  createBook({ id: "a", title: "Dune", author: "Frank Herbert" }),
  createBook({ id: "b", title: "Emma", author: null, current_progress: 20 }),
];

const goals: Record<string, DailyGoal> = {
  a: { start: 40, end: 60 },
  b: { start: 20, end: 30 },
};

function renderSidebar(selectedId: string | null = null) {
  const onSelect = vi.fn();
  const result = render(BookSidebar, {
    props: { books, selectedId, getDailyGoal: (b: Book) => goals[b.id], onSelect },
  });
  return { ...result, onSelect };
}

describe("BookSidebar", () => {
  // The sidebar stays compact: the author lives on the full card, not here.
  it("lists every book by title, without the author", () => {
    const { getByText, queryByText } = renderSidebar();
    expect(getByText("Dune")).toBeTruthy();
    expect(getByText("Emma")).toBeTruthy();
    expect(queryByText("Frank Herbert")).toBeNull();
  });

  it("shows the target date on the same row as the title", () => {
    const withDate = [createBook({ id: "a", title: "Dune", target_date: "2026-12-20" })];
    const { container } = render(BookSidebar, {
      props: { books: withDate, selectedId: null, getDailyGoal: () => goals.a, onSelect: vi.fn() },
    });
    const row = container.querySelector(".item-header");
    expect(row?.querySelector(".item-title")?.textContent).toBe("Dune");
    expect(row?.querySelector(".item-target")?.textContent).toBe(formatLocalDate("2026-12-20"));
  });

  it("shows no date when the book has no target", () => {
    const { container } = renderSidebar();
    expect(container.querySelector(".item-target")).toBeNull();
  });

  // Each entry shows both overall progress and today's goal at a glance.
  it("shows an overall bar and a daily-goal bar for each book", () => {
    const { container } = renderSidebar();
    const items = container.querySelectorAll(".sidebar-item");
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.querySelectorAll(".progress-bar")).toHaveLength(2);
    }
    const fills = items[0].querySelectorAll<HTMLElement>(".progress-fill");
    expect(fills[0].style.width).toBe("50%"); // 50 / 100 overall
    expect(fills[1].style.width).toBe("50%"); // 10 of 20 into today's range
  });

  it("reports which book was clicked", async () => {
    const { getByText, onSelect } = renderSidebar();
    await fireEvent.click(getByText("Emma"));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("marks the selected book", () => {
    const { container } = renderSidebar("b");
    const selected = container.querySelectorAll('[aria-current="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain("Emma");
  });
});
