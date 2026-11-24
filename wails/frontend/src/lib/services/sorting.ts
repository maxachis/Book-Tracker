import type { Book, ReadingSortField, SortConfig, SortField, SortOption } from "../types";

/** The hand-arranged order; it has no direction to flip. */
export const CUSTOM_ORDER = "custom" satisfies ReadingSortField;

export const FINISHED_SORT_OPTIONS: SortOption<SortField>[] = [
  { value: "created_at", label: "Date Added" },
  { value: "title", label: "Title" },
  { value: "target_date", label: "Target Date" },
  { value: "progress", label: "Progress" },
];

export const READING_SORT_OPTIONS: SortOption<ReadingSortField>[] = [
  { value: CUSTOM_ORDER, label: "Custom" },
  ...FINISHED_SORT_OPTIONS,
  { value: "next_due", label: "Next Page Due" },
];

export const DEFAULT_READING_SORT: SortConfig<ReadingSortField> = { field: CUSTOM_ORDER, direction: "asc" };

/** A value to compare by, or null when the book has none (it then sorts last). */
type SortKey = (book: Book) => number | string | null;

function timeOrNull(iso: string | null | undefined): number | null {
  return iso ? new Date(iso).getTime() : null;
}

function sortKeyFor(
  field: Exclude<ReadingSortField, typeof CUSTOM_ORDER>,
  nextDueAt: (book: Book) => Date | null
): SortKey {
  switch (field) {
    case "title":
      return (b) => b.title;
    case "created_at":
      return (b) => timeOrNull(b.created_at);
    case "target_date":
      return (b) => timeOrNull(b.target_date);
    case "progress":
      return (b) => (b.total_progress > 0 ? b.current_progress / b.total_progress : 0);
    case "next_due":
      return (b) => nextDueAt(b)?.getTime() ?? null;
  }
}

function compareKeys(a: number | string, b: number | string): number {
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
  return (a as number) - (b as number);
}

/**
 * Orders Reading-tab books. `books` arrives in the reader's custom order, which
 * Custom keeps as is and which breaks ties for every other field. Books with
 * nothing to compare (no target date, or today's goal met so no page is due)
 * go last in either direction.
 */
export function sortReadingBooks(
  books: Book[],
  { config, nextDueAt }: { config: SortConfig<ReadingSortField>; nextDueAt: (book: Book) => Date | null }
): Book[] {
  if (config.field === CUSTOM_ORDER) return [...books];
  const key = sortKeyFor(config.field, nextDueAt);
  const multiplier = config.direction === "asc" ? 1 : -1;
  // Array.prototype.sort is stable, so ties keep the incoming custom order.
  return [...books].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === null && kb === null) return 0;
    if (ka === null) return 1;
    if (kb === null) return -1;
    return multiplier * compareKeys(ka, kb);
  });
}
