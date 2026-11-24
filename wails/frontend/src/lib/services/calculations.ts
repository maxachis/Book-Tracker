import type { Book, DailyGoal, ReadingGoal, Statistics, UserSettings } from "../types";

export function calculateReadingGoal(
  book: Book,
  settings: UserSettings,
  dailyGoal?: DailyGoal
): ReadingGoal | null {
  if (!book.target_date || book.completed_at) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse target_date as local date to avoid UTC timezone shift
  const [year, month, day] = book.target_date.split('-').map(Number);
  const target = new Date(year, month - 1, day);

  const daysUntilTarget = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  // Include today as an available reading day
  const daysRemaining = daysUntilTarget + 1;

  const remaining = book.total_progress - book.current_progress;
  const availableHours = settings.reading_end_hour - settings.reading_start_hour;

  // Calculate hours remaining today until end of reading window
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const pagesPerHourToday = calculatePagesPerHourToday(
    book.current_progress,
    remaining,
    daysRemaining,
    currentHour,
    settings.reading_start_hour,
    settings.reading_end_hour,
    dailyGoal
  );

  if (daysRemaining <= 0) {
    return {
      pagesPerDay: remaining,
      pagesPerHour: availableHours > 0 ? remaining / availableHours : remaining,
      pagesPerHourToday,
      daysRemaining: 0,
      isOverdue: true,
    };
  }

  const pagesPerDay = remaining / daysRemaining;
  const pagesPerHour = availableHours > 0 ? pagesPerDay / availableHours : pagesPerDay;

  return {
    pagesPerDay: Math.ceil(pagesPerDay * 10) / 10,
    pagesPerHour: Math.ceil(pagesPerHour * 10) / 10,
    pagesPerHourToday,
    daysRemaining,
    isOverdue: false,
  };
}

function calculatePagesPerHourToday(
  currentProgress: number,
  remaining: number,
  daysRemaining: number,
  currentHour: number,
  readingStartHour: number,
  readingEndHour: number,
  dailyGoal?: DailyGoal
): number | null {
  const availableHours = readingEndHour - readingStartHour;
  if (availableHours <= 0) return null;

  // If past reading hours, return null (reading window closed)
  if (currentHour >= readingEndHour) {
    return null;
  }

  // Calculate hours remaining today
  const hoursRemainingToday = currentHour < readingStartHour
    ? availableHours
    : readingEndHour - currentHour;

  if (hoursRemainingToday <= 0) return null;

  // If we have a daily goal, use it to calculate remaining pages for today
  if (dailyGoal) {
    const todayRemaining = Math.max(0, dailyGoal.end - currentProgress);
    if (todayRemaining === 0) return 0; // Daily goal achieved!
    return Math.ceil((todayRemaining / hoursRemainingToday) * 10) / 10;
  }

  // Fallback: calculate based on overall remaining / days
  const pagesPerDay = daysRemaining > 0 ? remaining / daysRemaining : remaining;
  return Math.ceil((pagesPerDay / hoursRemainingToday) * 10) / 10;
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

/** Share of what's left that a default daily goal covers when there's no target-date pace. */
const DEFAULT_DAILY_GOAL_FRACTION = 0.1;

export function defaultDailyGoal(book: Book, settings: UserSettings): DailyGoal {
  const start = book.current_progress;
  const goal = calculateReadingGoal(book, settings);
  const increment =
    goal && goal.pagesPerDay > 0
      ? Math.ceil(goal.pagesPerDay)
      : Math.max(1, Math.ceil((book.total_progress - start) * DEFAULT_DAILY_GOAL_FRACTION));
  return { start, end: Math.min(start + increment, book.total_progress) };
}

export function dailyGoalPercentage(currentProgress: number, goal: DailyGoal): number {
  const range = goal.end - goal.start;
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, ((currentProgress - goal.start) / range) * 100));
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Without a target date, each day's goal is a tenth of what's left: spread over 10 days. */
const FALLBACK_DAYS = 1 / DEFAULT_DAILY_GOAL_FRACTION;

/**
 * How many days what's left is spread over from tomorrow: through the target
 * date inclusive, 1 if the target is today or past (everything is due), or
 * the tenth-a-day fallback without a target.
 */
function daysFromTomorrow({ book, today }: { book: Book; today: Date }): number {
  if (!book.target_date) return FALLBACK_DAYS;
  const [year, month, day] = book.target_date.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(1, Math.round((target.getTime() - startOfToday.getTime()) / MS_PER_DAY));
}

/**
 * What tomorrow's goal will ask for: what's left spread evenly over tomorrow
 * through the target date (everything, if the target is today or past), or the
 * same tenth-of-what's-left fallback as today's default goal without a target.
 */
export function tomorrowGoalAmount({ book, today }: { book: Book; today: Date }): number {
  const remaining = Math.max(0, book.total_progress - book.current_progress);
  if (remaining === 0) return 0;
  return Math.ceil(remaining / daysFromTomorrow({ book, today }));
}

export interface TomorrowGoalDrop {
  /** What tomorrow's goal asks for now. */
  tomorrow: number;
  /** What it would ask for after reading `needed` more today. */
  droppedTo: number;
  /** Units still to read today for tomorrow's goal to drop by one. */
  needed: number;
  /** How far through the current stretch (one unit of tomorrow's goal) today's reading is, 0–100. */
  percentage: number;
}

/**
 * How much more reading today lowers tomorrow's goal by one whole unit.
 * Tomorrow asks for ceil(left / days), so it stays the same while what's left
 * is within one stretch of `days` units; finishing the stretch drops it by one.
 * Null once the book is finished.
 */
export function tomorrowGoalDrop({ book, today }: { book: Book; today: Date }): TomorrowGoalDrop | null {
  const remaining = Math.max(0, book.total_progress - book.current_progress);
  if (remaining === 0) return null;
  const days = daysFromTomorrow({ book, today });
  const tomorrow = Math.ceil(remaining / days);
  const stretchEnd = (tomorrow - 1) * days;
  return {
    tomorrow,
    droppedTo: tomorrow - 1,
    needed: remaining - stretchEnd,
    percentage: ((tomorrow * days - remaining) / days) * 100,
  };
}
