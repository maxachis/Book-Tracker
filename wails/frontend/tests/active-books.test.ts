import { beforeEach, describe, expect, it, vi } from "vitest";
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
    SetBookOrder: (ids: string[]) => {
      backend.setBookOrder(ids);
      backend.order = ids;
      return ok(undefined);
    },
  };
});

import ActiveBooks from "../src/views/ActiveBooks.svelte";
import { appState } from "../src/lib/stores/state.svelte";

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
  await appState.loadData();
});

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

  // The reading order is whatever the reader arranged by hand; there is no
  // other sort to switch to.
  it("offers no sort control", () => {
    const { queryByRole } = render(ActiveBooks);
    expect(queryByRole("combobox", { name: "Sort" })).toBeNull();
    expect(queryByRole("button", { name: /Ascending|Descending/ })).toBeNull();
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
