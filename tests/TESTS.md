# Tests

## calculations.test.ts

Tests for the reading goal calculation and statistics services.

- **calculateReadingGoal**: Verifies that reading goals are calculated correctly based on target dates, current progress, and reading hours configuration. Includes tests that today is counted as an available reading day in daysRemaining.
- **calculateReadingGoal with dailyGoal**: Tests that pagesPerHourToday uses the daily goal's remaining pages when provided, returns 0 when daily goal is achieved, and falls back to default calculation when no daily goal is provided.
- **calculateStatistics**: Tests book statistics aggregation including filtering by start date.
- **getProgressLabel**: Tests progress type label mapping (page, location, percentage).
- **formatProgress**: Tests formatting of progress display strings.
- **getProgressPercentage**: Tests percentage calculation for book progress.

## dates.test.ts

Tests for date formatting utilities that avoid timezone-related display bugs.

- **formatLocalDate**: Verifies that YYYY-MM-DD date strings are displayed as the correct local date (not shifted by UTC parsing), and that full datetime strings are handled normally.

## daily-goals.test.ts

Tests for daily goal state management and persistence logic.

- **DailyGoal type and operations**: Verifies the DailyGoal data structure and progress calculations.
- **DailyGoals Map operations**: Tests the Map-based storage for daily goals keyed by book ID.
- **Daily goal persistence across tab switches**: Verifies that daily goals persist in shared state when switching between tabs.
