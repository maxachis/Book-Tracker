import type { Book } from "../types";

function newestFirst(a: Book, b: Book): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

/**
 * Arranges books in the reader's saved order. Books with no saved position
 * (e.g. just added) go on top, newest first, so they're easy to find.
 */
export function applyCustomOrder(books: Book[], orderIds: string[]): Book[] {
  const position = new Map(orderIds.map((id, index) => [id, index]));
  const unplaced = books.filter((b) => !position.has(b.id)).sort(newestFirst);
  const placed = books
    .filter((b) => position.has(b.id))
    .sort((a, b) => position.get(a.id)! - position.get(b.id)!);
  return [...unplaced, ...placed];
}

/** Returns a copy of `items` with the element at `from` relocated to `to` (clamped). */
export function moveItem<T>(items: T[], { from, to }: { from: number; to: number }): T[] {
  const result = [...items];
  const [moved] = result.splice(from, 1);
  const target = Math.max(0, Math.min(to, result.length));
  result.splice(target, 0, moved);
  return result;
}
