import type { Book, ReadingGoal, Statistics, UserSettings } from "../types";

export function calculateReadingGoal(
  book: Book,
  settings: UserSettings
): ReadingGoal | null {
  if (!book.target_date || book.completed_at) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(book.target_date);
  target.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const remaining = book.total_progress - book.current_progress;
  const availableHours = settings.reading_end_hour - settings.reading_start_hour;

  if (daysRemaining <= 0) {
    return {
      pagesPerDay: remaining,
      pagesPerHour: availableHours > 0 ? remaining / availableHours : remaining,
      daysRemaining: 0,
      isOverdue: true,
    };
  }

  const pagesPerDay = remaining / daysRemaining;
  const pagesPerHour = availableHours > 0 ? pagesPerDay / availableHours : pagesPerDay;

  return {
    pagesPerDay: Math.ceil(pagesPerDay * 10) / 10,
    pagesPerHour: Math.ceil(pagesPerHour * 10) / 10,
    daysRemaining,
    isOverdue: false,
  };
}

export function calculateStatistics(
  books: Book[],
  statsStartDate: string | null
): Statistics {
  let filteredBooks = books;

  if (statsStartDate) {
    const startDate = new Date(statsStartDate);
    filteredBooks = books.filter((book) => {
      const createdAt = new Date(book.created_at);
      return createdAt >= startDate;
    });
  }

  const totalBooks = filteredBooks.length;
  const completedBooks = filteredBooks.filter((b) => b.completed_at !== null).length;
  const activeBooks = totalBooks - completedBooks;
  const completionRate = totalBooks > 0 ? (completedBooks / totalBooks) * 100 : 0;

  return {
    totalBooks,
    completedBooks,
    activeBooks,
    completionRate: Math.round(completionRate * 10) / 10,
  };
}

export function getProgressLabel(progressType: string): string {
  switch (progressType) {
    case "page":
      return "pages";
    case "location":
      return "locations";
    case "percentage":
      return "%";
    default:
      return "";
  }
}

export function formatProgress(book: Book): string {
  const label = getProgressLabel(book.progress_type);
  if (book.progress_type === "percentage") {
    return `${book.current_progress}%`;
  }
  return `${book.current_progress} / ${book.total_progress} ${label}`;
}

export function getProgressPercentage(book: Book): number {
  if (book.total_progress === 0) return 0;
  return (book.current_progress / book.total_progress) * 100;
}
