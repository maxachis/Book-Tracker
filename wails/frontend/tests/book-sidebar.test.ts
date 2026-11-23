import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync } from "svelte";
import DayCountdown from "../src/lib/components/DayCountdown.svelte";
import { resetDueClock } from "../src/lib/stores/dueClock.svelte";
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

const END_HOUR = 22;

function renderSidebar(
  { selectedId = null, books: shown = books }: { selectedId?: string | null; books?: Book[] } = {}
) {
  const onSelect = vi.fn();
  const result = render(BookSidebar, {
    props: { books: shown, selectedId, getDailyGoal: (b: Book) => goals[b.id], onSelect, endHour: END_HOUR },
  });
  return { ...result, onSelect };
}

function advanceSeconds(seconds: number) {
  vi.advanceTimersByTime(seconds * 1000);
  flushSync();
}

beforeEach(() => {
  resetDueClock();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 23, 20, 0, 0)); // 8:00 PM local
});

afterEach(() => {
  vi.useRealTimers();
});

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
      props: { books: withDate, selectedId: null, getDailyGoal: () => goals.a, onSelect: vi.fn(), endHour: END_HOUR },
    });
    const row = container.querySelector(".item-header");
    expect(row?.querySelector(".item-title")?.textContent).toBe("Dune");
    expect(row?.querySelector(".item-target")?.textContent).toBe(formatLocalDate("2026-12-20"));
  });

  it("shows no date when the book has no target", () => {
    const { container } = renderSidebar();
    expect(container.querySelector(".item-target")).toBeNull();
  });

  // Until today's goal is met the entry is about today: how far through
  // today's goal, and how long until the next page is due.
  it("shows only today's bar and the next-due countdown while today's goal is unmet", () => {
    const { container } = renderSidebar();
    const item = container.querySelector<HTMLElement>('[data-id="a"]')!;
    expect(item.querySelectorAll(".progress-bar")).toHaveLength(1);
    expect(item.textContent).toContain("Today");
    expect(item.textContent).not.toContain("Overall");
    expect(item.querySelector<HTMLElement>(".progress-fill")!.style.width).toBe("50%"); // 10 of 20
    // 10 pages left over the 2 hours until 10 PM
    expect(item.querySelector('[data-metric="next-due"]')!.textContent).toMatch(/Next page\s*00:12:00/);
    expect(item.classList.contains("goal-met")).toBe(false);
  });

  it("counts the next-due time down every second", () => {
    const { container } = renderSidebar();
    advanceSeconds(60);
    expect(container.querySelector('[data-id="a"] [data-metric="next-due"]')!.textContent).toContain("00:11:00");
  });

  // Once today's goal is met the entry looks ahead: the whole book, and
  // what tomorrow will ask for.
  it("marks a book whose goal is met and shows overall progress and tomorrow's amount", () => {
    const { container } = renderSidebar({
      books: [createBook({ id: "a", current_progress: 60, target_date: "2026-11-27" })],
    });
    const item = container.querySelector<HTMLElement>('[data-id="a"]')!;
    expect(item.classList.contains("goal-met")).toBe(true);
    expect(item.textContent).toContain("Today's goal met");
    expect(item.querySelectorAll(".progress-bar")).toHaveLength(1);
    expect(item.textContent).toContain("Overall");
    expect(item.querySelector<HTMLElement>(".progress-fill")!.style.width).toBe("60%");
    expect(item.querySelector('[data-metric="next-due"]')).toBeNull();
    // 40 left over Nov 24..27
    expect(item.querySelector('[data-metric="tomorrow"]')!.textContent).toMatch(/Tomorrow\s*10 pages/);
  });

  // The sidebar and the open card must agree on when the next page is due,
  // even though the card was opened later.
  it("shows the same next-due time as the open card", () => {
    const card = render(DayCountdown, { props: { book: books[0], dailyGoal: goals.a, endHour: END_HOUR } });
    advanceSeconds(45);
    const { container } = renderSidebar();
    const sidebarTime = container.querySelector('[data-id="a"] [data-metric="next-due"] .value')!.textContent;
    const cardTime = card.container.querySelector('[data-metric="next-due"] .countdown-value')!.textContent;
    expect(sidebarTime).toBe("00:11:15");
    expect(cardTime?.trim()).toBe(sidebarTime);
  });

  it("reports which book was clicked", async () => {
    const { getByText, onSelect } = renderSidebar();
    await fireEvent.click(getByText("Emma"));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("marks the selected book", () => {
    const { container } = renderSidebar({ selectedId: "b" });
    const selected = container.querySelectorAll('[aria-current="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain("Emma");
  });
});
