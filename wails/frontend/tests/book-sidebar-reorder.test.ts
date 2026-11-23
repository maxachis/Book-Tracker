import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import BookSidebar from "../src/lib/components/BookSidebar.svelte";
import type { Book } from "../src/lib/types";

function createBook(id: string): Book {
  return {
    id,
    title: `Book ${id}`,
    author: null,
    current_progress: 10,
    total_progress: 100,
    progress_type: "page",
    target_date: null,
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
  };
}

const ITEM_HEIGHT = 100;

function renderSidebar() {
  const onSelect = vi.fn();
  const onReorder = vi.fn();
  const result = render(BookSidebar, {
    props: {
      books: ["a", "b", "c"].map(createBook),
      selectedId: null,
      getDailyGoal: () => ({ start: 10, end: 20 }),
      onSelect,
      onReorder,
    },
  });
  // jsdom has no layout; give each item a stacked 100px-tall box so
  // pointer positions map onto list slots.
  const items = [...result.container.querySelectorAll<HTMLElement>(".sidebar-item")];
  items.forEach((el) => {
    el.getBoundingClientRect = () => {
      const index = [...result.container.querySelectorAll(".sidebar-item")].indexOf(el);
      const top = index * ITEM_HEIGHT;
      return { top, bottom: top + ITEM_HEIGHT, height: ITEM_HEIGHT, left: 0, right: 300, width: 300, x: 0, y: top, toJSON() {} } as DOMRect;
    };
  });
  return { ...result, items, onSelect, onReorder };
}

async function drag(el: HTMLElement, fromY: number, toY: number) {
  await fireEvent.pointerDown(el, { clientY: fromY, button: 0, pointerId: 1 });
  await fireEvent.pointerMove(el, { clientY: (fromY + toY) / 2, pointerId: 1 });
  await fireEvent.pointerMove(el, { clientY: toY, pointerId: 1 });
  await fireEvent.pointerUp(el, { clientY: toY, pointerId: 1 });
  await fireEvent.click(el);
}

describe("BookSidebar drag to reorder", () => {
  it("dragging the first book below the last moves it to the end", async () => {
    const { items, onReorder } = renderSidebar();
    await drag(items[0], 50, 290);
    expect(onReorder).toHaveBeenCalledWith(["b", "c", "a"]);
  });

  it("dragging a book upward moves it above the books it passes", async () => {
    const { items, onReorder } = renderSidebar();
    await drag(items[2], 250, 20);
    expect(onReorder).toHaveBeenCalledWith(["c", "a", "b"]);
  });

  // The click that ends a drag must not also count as choosing the book.
  it("does not select the book that was dragged", async () => {
    const { items, onSelect } = renderSidebar();
    await drag(items[0], 50, 290);
    expect(onSelect).not.toHaveBeenCalled();
  });

  // Small jitter during an ordinary click shouldn't turn it into a drag.
  it("treats a tiny pointer movement as a click, not a drag", async () => {
    const { items, onSelect, onReorder } = renderSidebar();
    await drag(items[1], 150, 152);
    expect(onReorder).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("does not report a reorder when the book is dropped where it started", async () => {
    const { items, onReorder } = renderSidebar();
    await drag(items[1], 150, 140);
    expect(onReorder).not.toHaveBeenCalled();
  });

  // Keyboard alternative to dragging.
  it("Alt+ArrowDown and Alt+ArrowUp move the focused book one place", async () => {
    const { items, onReorder } = renderSidebar();
    await fireEvent.keyDown(items[0], { key: "ArrowDown", altKey: true });
    expect(onReorder).toHaveBeenLastCalledWith(["b", "a", "c"]);
    await fireEvent.keyDown(items[2], { key: "ArrowUp", altKey: true });
    expect(onReorder).toHaveBeenLastCalledWith(["a", "c", "b"]);
  });
});

// While dragging, a copy of the card follows the pointer so the reader can
// see what they're moving; its old slot marks where it will land.
describe("BookSidebar drag ghost", () => {
  it("shows a ghost of the dragged book that follows the pointer", async () => {
    const { items, container } = renderSidebar();
    // Grab item b 30px below its top edge (it spans 100–200).
    await fireEvent.pointerDown(items[1], { clientX: 40, clientY: 130, button: 0, pointerId: 1 });
    await fireEvent.pointerMove(items[1], { clientX: 40, clientY: 160, pointerId: 1 });
    await fireEvent.pointerMove(items[1], { clientX: 60, clientY: 240, pointerId: 1 });

    const ghost = document.querySelector<HTMLElement>(".drag-ghost");
    expect(ghost).toBeTruthy();
    expect(ghost!.textContent).toContain("Book b");
    // Keeps the grab point under the pointer: 240 - 30 from the top, 60 - 40 from the left.
    expect(ghost!.style.top).toBe("210px");
    expect(ghost!.style.left).toBe("20px");
    expect(ghost!.style.width).toBe("300px");
    // The ghost is decoration; it must not intercept pointer events or be announced.
    expect(ghost!.getAttribute("aria-hidden")).toBe("true");

    expect(container.querySelectorAll(".sidebar-item.placeholder")).toHaveLength(1);
    expect(container.querySelector(".sidebar-item.placeholder")?.textContent).toContain("Book b");
  });

  it("removes the ghost when the book is dropped", async () => {
    const { items, container } = renderSidebar();
    await fireEvent.pointerDown(items[1], { clientX: 40, clientY: 130, button: 0, pointerId: 1 });
    await fireEvent.pointerMove(items[1], { clientX: 40, clientY: 240, pointerId: 1 });
    await fireEvent.pointerUp(items[1], { clientX: 40, clientY: 240, pointerId: 1 });
    expect(document.querySelector(".drag-ghost")).toBeNull();
    expect(container.querySelector(".sidebar-item.placeholder")).toBeNull();
  });

  it("shows no ghost for a plain click", async () => {
    const { items } = renderSidebar();
    await fireEvent.pointerDown(items[1], { clientX: 40, clientY: 130, button: 0, pointerId: 1 });
    await fireEvent.pointerMove(items[1], { clientX: 41, clientY: 132, pointerId: 1 });
    expect(document.querySelector(".drag-ghost")).toBeNull();
  });
});
