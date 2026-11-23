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

## daily-goal-math.test.ts

Tests for the shared daily-goal math used by both the sidebar and the book card.

- **defaultDailyGoal**: Verifies the default goal starts at current progress, aims for the target-date pace (or 10% of what remains without one), and never runs past the book's total.
- **dailyGoalPercentage**: Verifies today's progress percentage is clamped to 0–100 and that an empty range counts as complete.

## editable-field.test.ts

Tests for the click-to-edit field used for a book's title, author, end and target date.

- **EditableField**: Verifies it shows text until clicked, saves on Enter or blur, discards on Escape, skips unchanged or empty-required values, can open already editing with its text focused and selected, shows a placeholder when empty, and edits the raw value behind formatted display text.

## book-sidebar.test.ts

Tests for the Reading tab's book sidebar.

- **BookSidebar**: Verifies every book is listed by title (no author) with its target date, when set, on the title row, an overall bar and a daily-goal bar, that clicking reports the selected book, and that the selected entry is marked.

## book-card-inline-edit.test.ts

Tests for in-place editing on the book card shown on the Reading tab.

- **BookCard inline editing**: Verifies title, author, end page and target date are edited in place and saved as partial updates, that missing author/target date show an "add" prompt, that the tracking unit (pages/locations/percentage) can be changed, and that no separate Edit button appears.

## ordering.test.ts

Tests for arranging books in the reader's hand-picked order.

- **applyCustomOrder**: Verifies the saved order is followed, that with no saved order the list is newest-first, that books missing from the saved order (just added) go on top, and that stale saved IDs are ignored.
- **moveItem**: Verifies moving an item up or down, clamping past either end, and that the input list isn't mutated.

## book-sidebar-reorder.test.ts

Tests for reordering books in the Reading tab sidebar.

- **BookSidebar drag to reorder**: Verifies dragging up or down reports the new order, that ending a drag doesn't also select the book, that click jitter stays a click, that dropping in place reports nothing, and that Alt+Arrow keys move a book one place.
- **BookSidebar drag ghost**: Verifies a ghost of the dragged book follows the pointer (keeping the grab point under it) while its list slot shows as a placeholder, and that the ghost disappears on drop and never appears for a plain click.

## sort-controls.test.ts

Tests for the sort control used on the Finished tab.

- **SortControls**: Verifies the control is labelled "Sort", offers no Custom order, reports a newly chosen field while keeping the direction, shows the direction as a bare arrow (named Ascending/Descending for screen readers and the tooltip), and flips the direction when the arrow is clicked.

## active-books.test.ts

Tests for the Reading tab as a whole, with the backend stubbed.

- **Reading tab**: Verifies books follow the saved order, there is no sort control, the first book's card shows without a click, moving the shown book keeps its card on screen, clicking another book switches the card, and moving a book saves the order.
- **Reading tab: Add Book**: Verifies Add Book creates an "Untitled Book" instead of opening a form, and that it appears at the top, selected, with its title ready to type over.
- **Dropdown** (`dropdown.test.ts`): Verifies the themed dropdown shows the current choice, stays as wide as its longest option whatever is selected, opens a list marking it by weight and color (no checkmark), reports a new choice (but not re-picking the current one), works by keyboard (arrows, Enter, Escape), and closes when clicking elsewhere.

## countdown.test.ts

Tests for the end-of-day countdown math.

- **formatCountdown**: Verifies seconds display as HH:MM:SS, dropping fractions and never going negative.
- **secondsUntilEndOfDay**: Verifies the time left until the reading end hour (local time), and that it is zero once that hour has passed.
- **secondsPerUnitDue**: Verifies the time left is spread over the units still needed for today's goal (pages, whole percent, or blocks of 100 locations), with nothing due once the goal is met.
- **nextDueDeadline**: Verifies the next unit is due one even-pace interval from now, and that nothing is due once today's goal is met.
- **paceUnitLabel**: Verifies each tracking type phrases one step as an amount for the pace ("1 page", "1%", "100 locations").
- **dueUnitLabel**: Verifies each tracking type names its due unit ("page", "1%", "100 locations").

## day-countdown.test.ts

Tests for the countdown row on the book card.

- **DayCountdown**: Verifies it shows the time left until the end of the reading day and until the next unit is due, ticks every second, names the unit for each tracking type, says "Goal met" once today's goal is reached, and stops its clock when removed. The next-due deadline counts down in real time beside a live "1 page every …" pace, and a new deadline starts when the old one passes without progress or when progress is logged. It also shows how much is left for today's goal in the book's own unit (pages, locations or percent), never below zero.
