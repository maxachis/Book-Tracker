import type { Book } from "../types";

export const DAYS_PER_WEEK = 7;
export const GRID_WEEKS = 6;
export const GRID_CELLS = DAYS_PER_WEEK * GRID_WEEKS;
export const MONTHS_PER_YEAR = 12;

export interface YearMonth {
  year: number;
  /** 0-based, as in Date. */
  month: number;
}

export interface DayCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

/** Local "YYYY-MM-DD" for a Date. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local-midnight Date for "YYYY-MM-DD" (never UTC, so the day cannot shift). */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Six Sunday-first weeks covering the month, padded with adjacent-month days. */
export function monthGrid({ year, month }: YearMonth): DayCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  return Array.from({ length: GRID_CELLS }, (_, i) => {
    const date = new Date(year, month, 1 - firstWeekday + i);
    return { iso: toISODate(date), day: date.getDate(), inMonth: date.getMonth() === month };
  });
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const total = year * MONTHS_PER_YEAR + month + delta;
  return { year: Math.floor(total / MONTHS_PER_YEAR), month: ((total % MONTHS_PER_YEAR) + MONTHS_PER_YEAR) % MONTHS_PER_YEAR };
}

/** Target date -> titles of the books aiming for it, ignoring one book and books without a target. */
export function groupTargetDates(books: Book[], { excludeId }: { excludeId: string }): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const book of books) {
    if (book.id === excludeId || !book.target_date) continue;
    const titles = grouped.get(book.target_date) ?? [];
    titles.push(book.title);
    grouped.set(book.target_date, titles);
  }
  return grouped;
}
