import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateReadingGoal,
  calculateStatistics,
  getProgressLabel,
  formatProgress,
  getProgressPercentage,
} from '../src/lib/services/calculations';
import type { Book, DailyGoal, UserSettings } from '../src/lib/types';

function createMockBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'test-book-1',
    title: 'Test Book',
    author: 'Test Author',
    current_progress: 100,
    total_progress: 300,
    progress_type: 'page',
    target_date: null,
    completed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    id: 1,
    reading_start_hour: 8,
    reading_end_hour: 22,
    stats_start_date: null,
    ...overrides,
  };
}

describe('calculateReadingGoal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  it('returns null when book has no target date', () => {
    const book = createMockBook({ target_date: null });
    const settings = createMockSettings();

    const result = calculateReadingGoal(book, settings);

    expect(result).toBeNull();
  });

  it('returns null when book is completed', () => {
    const book = createMockBook({
      target_date: '2024-06-20',
      completed_at: '2024-06-10T00:00:00Z',
    });
    const settings = createMockSettings();

    const result = calculateReadingGoal(book, settings);

    expect(result).toBeNull();
  });

  it('counts today as an available reading day in daysRemaining', () => {
    // Mock date: 2024-06-15. Target: 2024-06-19.
    // Available days: June 15, 16, 17, 18, 19 = 5 days
    const book = createMockBook({
      current_progress: 100,
      total_progress: 300,
      target_date: '2024-06-19',
    });
    const settings = createMockSettings();

    const result = calculateReadingGoal(book, settings);

    expect(result).not.toBeNull();
    expect(result!.daysRemaining).toBe(5);
    expect(result!.isOverdue).toBe(false);
    // 200 remaining pages / 5 days = 40 pages per day
    expect(result!.pagesPerDay).toBe(40);
  });

  it('counts today as 1 day remaining when target is today', () => {
    const book = createMockBook({
      current_progress: 100,
      total_progress: 300,
      target_date: '2024-06-15', // Same as mock date
    });
    const settings = createMockSettings();

    const result = calculateReadingGoal(book, settings);

    expect(result).not.toBeNull();
    expect(result!.daysRemaining).toBe(1);
    expect(result!.isOverdue).toBe(false);
    // 200 remaining pages / 1 day = 200 pages per day
    expect(result!.pagesPerDay).toBe(200);
  });

  it('calculates pages per hour correctly', () => {
    const book = createMockBook({
      current_progress: 100,
      total_progress: 300,
      target_date: '2024-06-19',
    });
    const settings = createMockSettings({
      reading_start_hour: 8,
      reading_end_hour: 22, // 14 hours available
    });

    const result = calculateReadingGoal(book, settings);

    expect(result).not.toBeNull();
    // pagesPerHour = pagesPerDay / availableHours
    const availableHours = 22 - 8;
    expect(result!.pagesPerHour).toBeCloseTo(result!.pagesPerDay / availableHours, 1);
  });

  it('marks as overdue when target date has passed', () => {
    const book = createMockBook({
      current_progress: 100,
      total_progress: 300,
      target_date: '2024-06-10', // 5 days before mock date
    });
    const settings = createMockSettings();

    const result = calculateReadingGoal(book, settings);

    expect(result).not.toBeNull();
    expect(result!.isOverdue).toBe(true);
    expect(result!.daysRemaining).toBe(0);
  });

  it('handles zero available reading hours', () => {
    const book = createMockBook({
      current_progress: 100,
      total_progress: 300,
      target_date: '2024-06-20',
    });
    const settings = createMockSettings({
      reading_start_hour: 10,
      reading_end_hour: 10, // 0 hours available
    });

    const result = calculateReadingGoal(book, settings);

    expect(result).not.toBeNull();
    // When no hours available, pagesPerHour should equal pagesPerDay
    expect(result!.pagesPerHour).toBe(result!.pagesPerDay);
  });

  it('uses daily goal for pagesPerHourToday when provided', () => {
    // Set time to 14:00 (2pm) - within reading hours
    vi.setSystemTime(new Date('2024-06-15T14:00:00'));

    const book = createMockBook({
      current_progress: 120, // Already read 20 pages today
      total_progress: 300,
      target_date: '2024-06-20',
    });
    const settings = createMockSettings({
      reading_start_hour: 8,
      reading_end_hour: 22, // 8 hours remaining from 14:00
    });
    const dailyGoal: DailyGoal = {
      start: 100, // Started today at page 100
      end: 150,   // Goal is to reach page 150
    };

    const result = calculateReadingGoal(book, settings, dailyGoal);

    expect(result).not.toBeNull();
    // todayRemaining = 150 - 120 = 30 pages
    // hoursRemaining = 22 - 14 = 8 hours
    // pagesPerHourToday = 30 / 8 = 3.75, rounded up = 3.8
    expect(result!.pagesPerHourToday).toBeCloseTo(3.8, 1);
  });

  it('returns 0 for pagesPerHourToday when daily goal is achieved', () => {
    vi.setSystemTime(new Date('2024-06-15T14:00:00'));

    const book = createMockBook({
      current_progress: 160, // Exceeded daily goal
      total_progress: 300,
      target_date: '2024-06-20',
    });
    const settings = createMockSettings({
      reading_start_hour: 8,
      reading_end_hour: 22,
    });
    const dailyGoal: DailyGoal = {
      start: 100,
      end: 150, // Goal was 150, current is 160
    };

    const result = calculateReadingGoal(book, settings, dailyGoal);

    expect(result).not.toBeNull();
    expect(result!.pagesPerHourToday).toBe(0);
  });

  it('falls back to default calculation when no daily goal provided', () => {
    vi.setSystemTime(new Date('2024-06-15T14:00:00'));

    const book = createMockBook({
      current_progress: 100,
      total_progress: 300,
      target_date: '2024-06-20',
    });
    const settings = createMockSettings({
      reading_start_hour: 8,
      reading_end_hour: 22,
    });

    // Daily goal with small remaining (only 10 pages to go today)
    const smallDailyGoal: DailyGoal = { start: 90, end: 110 };

    const resultWithoutDailyGoal = calculateReadingGoal(book, settings);
    const resultWithSmallDailyGoal = calculateReadingGoal(book, settings, smallDailyGoal);

    expect(resultWithoutDailyGoal).not.toBeNull();
    expect(resultWithSmallDailyGoal).not.toBeNull();

    // Without daily goal: uses pagesPerDay / hoursRemaining (larger value)
    // With small daily goal: uses (110 - 100) / 8 = 1.25, rounded = 1.3
    expect(resultWithSmallDailyGoal!.pagesPerHourToday).toBeCloseTo(1.3, 1);
    // Default should be higher since it's based on total remaining / days
    expect(resultWithoutDailyGoal!.pagesPerHourToday).toBeGreaterThan(resultWithSmallDailyGoal!.pagesPerHourToday!);
  });
});

describe('calculateStatistics', () => {
  it('calculates correct totals for all books', () => {
    const books: Book[] = [
      createMockBook({ id: '1', completed_at: null }),
      createMockBook({ id: '2', completed_at: null }),
      createMockBook({ id: '3', completed_at: '2024-01-15T00:00:00Z' }),
    ];

    const result = calculateStatistics(books, null);

    expect(result.totalBooks).toBe(3);
    expect(result.activeBooks).toBe(2);
    expect(result.completedBooks).toBe(1);
    expect(result.completionRate).toBeCloseTo(33.3, 1);
  });

  it('filters books by start date when provided', () => {
    const books: Book[] = [
      createMockBook({ id: '1', created_at: '2024-01-01T00:00:00Z' }),
      createMockBook({ id: '2', created_at: '2024-06-01T00:00:00Z' }),
      createMockBook({ id: '3', created_at: '2024-06-15T00:00:00Z' }),
    ];

    const result = calculateStatistics(books, '2024-05-01');

    expect(result.totalBooks).toBe(2); // Only books created after May 1
  });

  it('returns zero completion rate for empty book list', () => {
    const result = calculateStatistics([], null);

    expect(result.totalBooks).toBe(0);
    expect(result.completionRate).toBe(0);
  });
});

describe('getProgressLabel', () => {
  it('returns "pages" for page progress type', () => {
    expect(getProgressLabel('page')).toBe('pages');
  });

  it('returns "locations" for location progress type', () => {
    expect(getProgressLabel('location')).toBe('locations');
  });

  it('returns "%" for percentage progress type', () => {
    expect(getProgressLabel('percentage')).toBe('%');
  });

  it('returns empty string for unknown progress type', () => {
    expect(getProgressLabel('unknown')).toBe('');
  });
});

describe('formatProgress', () => {
  it('formats page progress correctly', () => {
    const book = createMockBook({
      current_progress: 150,
      total_progress: 300,
      progress_type: 'page',
    });

    expect(formatProgress(book)).toBe('150 / 300 pages');
  });

  it('formats percentage progress correctly', () => {
    const book = createMockBook({
      current_progress: 75,
      total_progress: 100,
      progress_type: 'percentage',
    });

    expect(formatProgress(book)).toBe('75%');
  });

  it('formats location progress correctly', () => {
    const book = createMockBook({
      current_progress: 1500,
      total_progress: 5000,
      progress_type: 'location',
    });

    expect(formatProgress(book)).toBe('1500 / 5000 locations');
  });
});

describe('getProgressPercentage', () => {
  it('calculates percentage correctly', () => {
    const book = createMockBook({
      current_progress: 150,
      total_progress: 300,
    });

    expect(getProgressPercentage(book)).toBe(50);
  });

  it('returns 0 when total progress is 0', () => {
    const book = createMockBook({
      current_progress: 0,
      total_progress: 0,
    });

    expect(getProgressPercentage(book)).toBe(0);
  });

  it('handles completed books (100%)', () => {
    const book = createMockBook({
      current_progress: 300,
      total_progress: 300,
    });

    expect(getProgressPercentage(book)).toBe(100);
  });
});
