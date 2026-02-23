import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import BookCard from "../src/lib/components/BookCard.svelte";
import type { Book, UserSettings } from "../src/lib/types";

function createBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    title: "Test Book",
    author: "Author",
    current_progress: 10,
    total_progress: 100,
    progress_type: "page",
    target_date: null,
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

function renderCard(book: Book, onProgressUpdate = vi.fn().mockResolvedValue(undefined)) {
  return {
    ...render(BookCard, {
      props: {
        book,
        settings,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onProgressUpdate,
      },
    }),
    onProgressUpdate,
  };
}

describe("BookCard quick-add", () => {
  it("renders quick-add button below update control in overall progress panel", () => {
    const { container, getByRole } = renderCard(createBook({ progress_type: "location" }));

    const overallPanel = container.querySelector(".panel-overall");
    const updateGroup = overallPanel?.querySelector(".progress-input-group");
    const quickAddRow = overallPanel?.querySelector(".quick-add-row");
    const quickAddButton = getByRole("button", { name: "+1 location" });

    expect(overallPanel).toBeTruthy();
    expect(updateGroup).toBeTruthy();
    expect(quickAddRow).toBeTruthy();
    expect(quickAddButton).toBeTruthy();
    expect(quickAddRow?.contains(quickAddButton)).toBe(true);
    expect(updateGroup?.compareDocumentPosition(quickAddRow as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("increments progress by one unit when current progress is below total", async () => {
    const { getByRole, onProgressUpdate } = renderCard(createBook({ current_progress: 25, total_progress: 40 }));

    await fireEvent.click(getByRole("button", { name: "+1 page" }));

    expect(onProgressUpdate).toHaveBeenCalledTimes(1);
    expect(onProgressUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "book-1" }),
      26
    );
  });

  it("clamps quick-add to total progress when increment would exceed total", async () => {
    const { getByRole, onProgressUpdate } = renderCard(createBook({ current_progress: 99, total_progress: 100 }));

    await fireEvent.click(getByRole("button", { name: "+1 page" }));

    expect(onProgressUpdate).toHaveBeenCalledTimes(1);
    expect(onProgressUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "book-1" }),
      100
    );
  });

  it("is disabled and does not update when already at total progress", async () => {
    const { getByRole, onProgressUpdate } = renderCard(createBook({ current_progress: 100, total_progress: 100 }));

    const button = getByRole("button", { name: "+1 page" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    await fireEvent.click(button);

    expect(onProgressUpdate).not.toHaveBeenCalled();
  });

  it("disables quick-add while progress update is in flight", async () => {
    let resolveUpdate: (() => void) | undefined;
    const onProgressUpdate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        })
    );

    const { getByRole } = renderCard(createBook({ current_progress: 10, total_progress: 50 }), onProgressUpdate);

    const button = getByRole("button", { name: "+1 page" }) as HTMLButtonElement;
    const clickPromise = fireEvent.click(button);

    await Promise.resolve();
    expect(button.disabled).toBe(true);

    resolveUpdate?.();
    await clickPromise;

    await Promise.resolve();
    expect(button.disabled).toBe(false);
  });

  it("shows percentage-specific quick-add label", () => {
    const { getByRole } = renderCard(createBook({ progress_type: "percentage", total_progress: 100 }));

    const button = getByRole("button", { name: "+1%" });
    expect(button).toBeTruthy();
  });
});
