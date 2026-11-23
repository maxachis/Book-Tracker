import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import BookForm from "../src/lib/components/BookForm.svelte";
import { appState } from "../src/lib/stores/state.svelte";
import type { Book } from "../src/lib/types";

function createBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    title: "Test Book",
    author: "Author",
    current_progress: 100,
    total_progress: 100,
    progress_type: "page",
    target_date: "2026-12-31",
    completed_at: "2026-11-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderForm(book: Book = createBook()) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const result = render(BookForm, { props: { book, onSubmit, onCancel: vi.fn() } });
  return { ...result, onSubmit };
}

const day = (iso: string) => document.querySelector<HTMLElement>(`[data-date="${iso}"]`);

afterEach(() => {
  appState.books = [];
});

// The form's target date uses the same calendar as the Reading tab card,
// in place of the browser's own date input.
describe("BookForm target date calendar", () => {
  it("submits the day picked from the calendar", async () => {
    const { getByRole, onSubmit } = renderForm();
    await fireEvent.click(getByRole("button", { name: "Edit Target completion date" }));
    await fireEvent.click(day("2026-12-15")!);
    expect(day("2026-12-15")).toBeNull();
    await fireEvent.click(getByRole("button", { name: "Update" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ target_date: "2026-12-15" }));
  });

  // The date is optional on the form, so it must be possible to remove it.
  it("can clear the target date so none is saved", async () => {
    const { getByRole, onSubmit } = renderForm();
    await fireEvent.click(getByRole("button", { name: "Clear Target completion date" }));
    expect(getByRole("button", { name: "Edit Target completion date" }).textContent).toContain("No target date");
    await fireEvent.click(getByRole("button", { name: "Update" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ target_date: null }));
  });

  it("does not offer to clear when there is no target date", () => {
    const { queryByRole } = renderForm(createBook({ target_date: null }));
    expect(queryByRole("button", { name: "Clear Target completion date" })).toBeNull();
  });

  // Opening the calendar must not submit the form it sits in.
  it("opening the calendar does not submit the form", async () => {
    const { getByRole, onSubmit } = renderForm();
    await fireEvent.click(getByRole("button", { name: "Edit Target completion date" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("marks days other reading books already target, but not this book's own", async () => {
    appState.books = [createBook({ id: "book-2", title: "Dune", target_date: "2026-12-20", completed_at: null })];
    const { getByRole } = renderForm();
    await fireEvent.click(getByRole("button", { name: "Edit Target completion date" }));
    expect(day("2026-12-20")!.classList.contains("marked")).toBe(true);
    expect(day("2026-12-31")!.classList.contains("marked")).toBe(false);
  });
});
