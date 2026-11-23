import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import BookCard from "../src/lib/components/BookCard.svelte";
import type { Book, UserSettings } from "../src/lib/types";
import { appState } from "../src/lib/stores/state.svelte";

function createBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    title: "Test Book",
    author: "Author",
    current_progress: 10,
    total_progress: 100,
    progress_type: "page",
    target_date: "2026-12-31",
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

const settings: UserSettings = {
  id: 1,
  reading_start_hour: 8,
  reading_end_hour: 20,
  stats_start_date: null,
};

function renderCard(book: Book = createBook()) {
  const onFieldUpdate = vi.fn().mockResolvedValue(undefined);
  const result = render(BookCard, {
    props: {
      book,
      settings,
      onDelete: vi.fn(),
      onProgressUpdate: vi.fn().mockResolvedValue(undefined),
      onFieldUpdate,
    },
  });
  return { ...result, onFieldUpdate };
}

async function editField(
  getByRole: ReturnType<typeof render>["getByRole"],
  label: string,
  value: string
) {
  await fireEvent.click(getByRole("button", { name: `Edit ${label}` }));
  const input = document.activeElement as HTMLInputElement;
  await fireEvent.input(input, { target: { value } });
  await fireEvent.keyDown(input, { key: "Enter" });
}

// On the Reading tab the card replaces the edit form: title, author, end
// page and target date are edited in place.
describe("BookCard inline editing", () => {
  it("edits the title in place", async () => {
    const { getByRole, onFieldUpdate } = renderCard();
    await editField(getByRole, "Title", "New Title");
    expect(onFieldUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "book-1" }), { title: "New Title" });
  });

  it("edits the author in place", async () => {
    const { getByRole, onFieldUpdate } = renderCard();
    await editField(getByRole, "Author", "Someone Else");
    expect(onFieldUpdate).toHaveBeenCalledWith(expect.anything(), { author: "Someone Else" });
  });

  it("offers to add an author when there is none", () => {
    const { getByRole } = renderCard(createBook({ author: null }));
    expect(getByRole("button", { name: "Edit Author" }).textContent).toContain("Add author");
  });

  it("edits the end page in place as a number", async () => {
    const { getByRole, onFieldUpdate } = renderCard();
    await editField(getByRole, "End page", "250");
    expect(onFieldUpdate).toHaveBeenCalledWith(expect.anything(), { total_progress: 250 });
  });

  // The target date is picked from a calendar rather than typed.
  it("opens a calendar on the book's month and saves the day picked", async () => {
    const { getByRole, onFieldUpdate } = renderCard();
    await fireEvent.click(getByRole("button", { name: "Edit Target date" }));
    const day = document.querySelector<HTMLElement>('[data-date="2026-12-15"]');
    expect(day).toBeTruthy();
    await fireEvent.click(day!);
    expect(onFieldUpdate).toHaveBeenCalledWith(expect.anything(), { target_date: "2026-12-15" });
    expect(document.querySelector("[data-date]")).toBeNull();
  });

  it("closes the calendar on Escape without saving", async () => {
    const { getByRole, onFieldUpdate } = renderCard();
    await fireEvent.click(getByRole("button", { name: "Edit Target date" }));
    await fireEvent.keyDown(document.querySelector<HTMLElement>('[data-date="2026-12-31"]')!, { key: "Escape" });
    expect(document.querySelector("[data-date]")).toBeNull();
    expect(onFieldUpdate).not.toHaveBeenCalled();
  });

  it("closes the calendar when clicking elsewhere", async () => {
    const { getByRole } = renderCard();
    await fireEvent.click(getByRole("button", { name: "Edit Target date" }));
    await fireEvent.pointerDown(document.body);
    expect(document.querySelector("[data-date]")).toBeNull();
  });

  // So the reader can see which days other books are already due, and spread them out.
  it("marks days that are already another reading book's target date", async () => {
    appState.books = [
      createBook(),
      createBook({ id: "book-2", title: "Dune", target_date: "2026-12-20" }),
    ];
    const { getByRole } = renderCard();
    await fireEvent.click(getByRole("button", { name: "Edit Target date" }));
    const other = document.querySelector<HTMLElement>('[data-date="2026-12-20"]')!;
    expect(other.classList.contains("marked")).toBe(true);
    expect(other.getAttribute("title")).toContain("Dune");
    // The book's own date is shown as selected, not as "taken".
    expect(document.querySelector('[data-date="2026-12-31"]')!.classList.contains("marked")).toBe(false);
    appState.books = [];
  });

  it("offers to add a target date when there is none", () => {
    const { getByRole } = renderCard(createBook({ target_date: null }));
    expect(getByRole("button", { name: "Edit Target date" }).textContent).toContain("Add target date");
  });

  // Without the old form this is the only place to say whether a book is
  // tracked by page, e-reader location, or percentage.
  it("changes what the book is tracked by", async () => {
    const { getByRole, onFieldUpdate } = renderCard();
    const tracking = getByRole("combobox", { name: "Tracking" });
    expect(tracking.querySelector(".trigger-label")?.textContent).toBe("Pages");
    await fireEvent.click(tracking);
    await fireEvent.click(getByRole("option", { name: "Locations" }));
    expect(onFieldUpdate).toHaveBeenCalledWith(expect.anything(), { progress_type: "location" });
  });

  it("has no separate Edit button when fields are editable in place", () => {
    const { queryByRole } = renderCard();
    expect(queryByRole("button", { name: "Edit" })).toBeNull();
  });
});
