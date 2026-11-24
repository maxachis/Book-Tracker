import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";
import type { Book } from "../src/lib/types";

const backend = vi.hoisted(() => ({
  books: [] as Book[],
  order: [] as string[],
  setBookOrder: vi.fn(),
  createBook: vi.fn(),
}));

vi.mock("../wailsjs/go/main/App", () => {
  const ok = <T>(v: T) => Promise.resolve(v);
  return {
    ListActiveBooks: () => ok(backend.books),
    ListCompletedBooks: () => ok([]),
    ListAllBooks: () => ok(backend.books),
    GetSettings: () => ok({ id: 1, reading_start_hour: 8, reading_end_hour: 22, stats_start_date: null }),
    GetDailyReadingSummary: (date: string) => ok({ date, books: [] }),
    GetBookOrder: () => ok(backend.order),
    GetDailyGoals: () => ok([]),
    SetDailyGoal: () => ok(undefined),
    CreateBook: (req: Omit<Book, "id" | "current_progress" | "completed_at" | "created_at">) => {
      backend.createBook(req);
      const created: Book = {
        ...req,
        id: "new",
        current_progress: 0,
        completed_at: null,
        created_at: "2026-12-01T00:00:00Z",
      };
      backend.books = [...backend.books, created];
      return ok(created);
    },
    UpdateBook: (req: { id: string; current_progress?: number }) => {
      backend.books = backend.books.map((b) =>
        b.id === req.id && req.current_progress !== undefined ? { ...b, current_progress: req.current_progress } : b
      );
      return ok(backend.books.find((b) => b.id === req.id));
    },
    MarkBookComplete: (id: string) => {
      const finished = backend.books.find((b) => b.id === id)!;
      backend.books = backend.books.filter((b) => b.id !== id);
      return ok({ ...finished, completed_at: "2026-12-01T00:00:00Z" });
    },
    SetBookOrder: (ids: string[]) => {
      backend.setBookOrder(ids);
      backend.order = ids;
      return ok(undefined);
    },
  };
});

import ActiveBooks from "../src/views/ActiveBooks.svelte";
import { appState } from "../src/lib/stores/state.svelte";
import { resetDueClock } from "../src/lib/stores/dueClock.svelte";

// jsdom has no Web Animations; the sidebar animates books leaving the list.
Element.prototype.getAnimations ??= () => [];
Element.prototype.animate ??= () =>
  ({ cancel() {}, finish() {}, onfinish: null, finished: Promise.resolve() }) as unknown as Animation;

function book(id: string, created_at: string): Book {
  return {
    id,
    title: `Book ${id}`,
    author: null,
    current_progress: 10,
    total_progress: 100,
    progress_type: "page",
    target_date: null,
    completed_at: null,
    created_at,
  };
}

beforeEach(async () => {
  backend.books = [book("a", "2026-01-01T00:00:00Z"), book("b", "2026-02-01T00:00:00Z")];
  backend.order = ["a", "b"];
  backend.setBookOrder.mockClear();
  backend.createBook.mockClear();
  appState.setReadingSort({ field: "custom", direction: "asc" });
  resetDueClock();
  await appState.loadData();
});

function sidebarTitles(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll(".sidebar-item .item-title")].map((el) => el.textContent);
}

function shownCardTitle(container: HTMLElement): string | undefined {
  return container.querySelector(".detail h3, .detail .book-title")?.textContent?.trim();
}

async function chooseSort(getByRole: ReturnType<typeof render>["getByRole"], label: string) {
  await fireEvent.click(getByRole("combobox", { name: "Sort" }));
  await fireEvent.click(getByRole("option", { name: label }));
}

describe("Reading tab", () => {
  // The saved order (a, b) is oldest-first, the opposite of the newest-first
  // fallback, so this only passes if the saved order is honored.
  it("lists books in the saved custom order", () => {
    const { container } = render(ActiveBooks);
    const titles = [...container.querySelectorAll(".sidebar-item .item-title")].map((el) => el.textContent);
    expect(titles).toEqual(["Book a", "Book b"]);
  });

  // So the reader lands on a book rather than an empty panel.
  it("shows the first book's card without needing a click", () => {
    const { container } = render(ActiveBooks);
    expect(container.querySelector(".book-card .book-title")?.textContent).toContain("Book a");
    expect(container.querySelector('[aria-current="true"]')?.textContent).toContain("Book a");
  });

  // Moving the book you're looking at shouldn't swap the card out from under you.
  it("keeps showing the preselected book after it is moved down the list", async () => {
    const { container } = render(ActiveBooks);
    const first = container.querySelector<HTMLElement>(".sidebar-item")!;
    await fireEvent.keyDown(first, { key: "ArrowDown", altKey: true });
    await waitFor(() => {
      expect(container.querySelector(".book-card .book-title")?.textContent).toContain("Book a");
    });
  });

  // A finished book leaves the Reading list, so the card moves on to the top
  // book and then stays there like any other shown book.
  it("shows the top book once the shown book is marked complete", async () => {
    const { container, getByRole } = render(ActiveBooks);
    expect(shownCardTitle(container)).toBe("Book a");
    await fireEvent.click(getByRole("button", { name: "Mark Complete" }));
    await waitFor(() => expect(sidebarTitles(container)).toEqual(["Book b"]));
    expect(shownCardTitle(container)).toBe("Book b");
  });

  it("switches the card when another book is clicked", async () => {
    const { container, getByText } = render(ActiveBooks);
    await fireEvent.click(getByText("Book b"));
    expect(container.querySelector(".book-card .book-title")?.textContent).toContain("Book b");
  });

  it("saves the new order when a book is moved", async () => {
    const { container } = render(ActiveBooks);
    const first = container.querySelector<HTMLElement>(".sidebar-item")!;
    await fireEvent.keyDown(first, { key: "ArrowDown", altKey: true });
    expect(backend.setBookOrder).toHaveBeenCalledWith(["b", "a"]);
    await waitFor(() => {
      const titles = [...container.querySelectorAll(".sidebar-item .item-title")].map((el) => el.textContent);
      expect(titles).toEqual(["Book b", "Book a"]);
    });
  });
});

// The reader can sort the list by a field, or keep the hand-arranged
// ("Custom") order, which is the default.
describe("Reading tab: sorting", () => {
  // Sorting acts on the whole Reading list, so it lives in the page header
  // with the other list-level action rather than inside the sidebar.
  it("sits on the header row beside Add Book", () => {
    const { getByRole } = render(ActiveBooks);
    const actions = getByRole("button", { name: /Add Book/ }).closest(".header-actions");
    expect(actions).not.toBeNull();
    expect(actions!.contains(getByRole("combobox", { name: "Sort" }))).toBe(true);
  });

  // The header is tight, so the visible "Sort" caption is dropped; the
  // control keeps "Sort" as its accessible name and hover tooltip.
  it("shows no visible Sort caption but keeps the name and tooltip", () => {
    const { container, getByRole } = render(ActiveBooks);
    const header = container.querySelector(".header-actions")!;
    expect(header.querySelector(".label-text")).toBeNull();
    const control = getByRole("combobox", { name: "Sort" });
    expect(control.closest("[title='Sort']")).not.toBeNull();
  });

  it("starts in Custom order with no direction toggle", () => {
    const { getByRole, queryByRole } = render(ActiveBooks);
    expect(getByRole("combobox", { name: "Sort" }).textContent).toContain("Custom");
    expect(queryByRole("button", { name: /Ascending|Descending/ })).toBeNull();
  });

  it("offers the previous sorts plus when the next page is due", async () => {
    const { getByRole, getAllByRole } = render(ActiveBooks);
    await fireEvent.click(getByRole("combobox", { name: "Sort" }));
    const labels = getAllByRole("option").map((o) => o.textContent?.trim());
    expect(labels).toEqual(["Custom", "Date Added", "Title", "Target Date", "Progress", "Next Page Due"]);
  });

  it("reorders the list by the chosen field and direction", async () => {
    backend.order = ["b", "a"];
    await appState.loadData();
    const { container, getByRole } = render(ActiveBooks);
    await chooseSort(getByRole, "Title");
    expect(sidebarTitles(container)).toEqual(["Book a", "Book b"]);
    await fireEvent.click(getByRole("button", { name: "Ascending" }));
    expect(sidebarTitles(container)).toEqual(["Book b", "Book a"]);
  });

  // A bigger daily goal in the same time left means a shorter wait per page,
  // so that book's next page is due sooner and it goes on top.
  describe("by next page due", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 10, 24, 12, 0, 0));
    });
    afterEach(() => vi.useRealTimers());

    it("puts the book whose next page is due soonest first", async () => {
      backend.books = [
        { ...book("a", "2026-01-01T00:00:00Z"), total_progress: 100 },
        { ...book("b", "2026-02-01T00:00:00Z"), total_progress: 1000 },
      ];
      await appState.loadData();
      const { container, getByRole } = render(ActiveBooks);
      await chooseSort(getByRole, "Next Page Due");
      expect(sidebarTitles(container)).toEqual(["Book b", "Book a"]);
    });

    // Logging progress pushes a book's next page later, which can drop it
    // down the list; the card must stay on the book being logged rather than
    // jump to whichever book is now on top. The sort outlives the tab, so on
    // coming back to Reading the card opens on the top book of the sorted list.
    it("keeps the card on the shown book when logging progress re-sorts the list", async () => {
      backend.books = [
        { ...book("a", "2026-01-01T00:00:00Z"), total_progress: 100 },
        { ...book("b", "2026-02-01T00:00:00Z"), total_progress: 1000 },
      ];
      await appState.loadData();
      appState.setReadingSort({ field: "next_due", direction: "asc" });
      const { container } = render(ActiveBooks);
      expect(shownCardTitle(container)).toBe("Book b");
      const box = container.querySelector<HTMLInputElement>("#progress-b")!;
      await fireEvent.input(box, { target: { value: "1000" } });
      await fireEvent.change(box);
      await waitFor(() => expect(sidebarTitles(container)).toEqual(["Book a", "Book b"]));
      expect(shownCardTitle(container)).toBe("Book b");
    });
  });

  // Arranging by hand only makes sense in Custom order, so a move while
  // sorted adopts what's on screen (with the move) as the new custom order.
  it("switches back to Custom, keeping the on-screen order, when a book is moved", async () => {
    const { container, getByRole } = render(ActiveBooks);
    await chooseSort(getByRole, "Title");
    await fireEvent.click(getByRole("button", { name: "Ascending" }));
    expect(sidebarTitles(container)).toEqual(["Book b", "Book a"]);
    const first = container.querySelector<HTMLElement>(".sidebar-item")!;
    await fireEvent.keyDown(first, { key: "ArrowDown", altKey: true });
    expect(backend.setBookOrder).toHaveBeenCalledWith(["a", "b"]);
    expect(getByRole("combobox", { name: "Sort" }).textContent).toContain("Custom");
    await waitFor(() => expect(sidebarTitles(container)).toEqual(["Book a", "Book b"]));
  });
});

// Adding a book skips the separate form: it creates a placeholder book and
// opens its card so the details are filled in place.
describe("Reading tab: Add Book", () => {
  it("creates an untitled book instead of opening a form", async () => {
    const { getByRole, container } = render(ActiveBooks);
    await fireEvent.click(getByRole("button", { name: /Add Book/ }));
    expect(backend.createBook).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Untitled Book", total_progress: 300, progress_type: "page" })
    );
    expect(container.querySelector(".book-form")).toBeNull();
  });

  it("puts the new book at the top of the list, selected, with its title ready to type", async () => {
    const { getByRole, container } = render(ActiveBooks);
    await fireEvent.click(getByRole("button", { name: /Add Book/ }));
    await waitFor(() => {
      const titles = [...container.querySelectorAll(".sidebar-item .item-title")].map((el) => el.textContent);
      expect(titles[0]).toBe("Untitled Book");
    });
    expect(container.querySelector('[aria-current="true"]')?.textContent).toContain("Untitled Book");
    const titleInput = getByRole("textbox", { name: "Title" }) as HTMLInputElement;
    expect(titleInput.value).toBe("Untitled Book");
    expect(document.activeElement).toBe(titleInput);
  });
});
