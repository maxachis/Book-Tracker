# Tests

## calculations.test.ts

Tests for the reading goal calculation and statistics services.

- **calculateReadingGoal**: Verifies that reading goals are calculated correctly based on target dates, current progress, and reading hours configuration. Includes tests that today is counted as an available reading day in daysRemaining.
- **calculateReadingGoal with dailyGoal**: Tests that pagesPerHourToday uses the daily goal's remaining pages when provided, returns 0 when daily goal is achieved, and falls back to default calculation when no daily goal is provided.
- **calculateStatistics**: Tests book statistics aggregation including filtering by start date.
- **getProgressLabel**: Tests progress type label mapping (page, location, percentage).
- **formatProgress**: Tests formatting of progress display strings.
- **getProgressPercentage**: Tests percentage calculation for book progress.
- **tomorrowGoalAmount**: Verifies tomorrow's amount spreads what's left over tomorrow through the target date (rounded up), asks for everything when the target is today or past, falls back to a tenth of what's left without a target, and is zero for a finished book.

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

- **BookSidebar**: Verifies every book is listed by title (no author) with its target date, when set, on the title row; that a book short of today's goal shows only today's bar plus a next-page countdown that ticks each second and matches the open card's; that a book whose goal is met is marked as such and shows the overall bar plus tomorrow's amount; that clicking reports the selected book; and that the selected entry is marked.

## book-card-inline-edit.test.ts

Tests for in-place editing on the book card shown on the Reading tab.

- **BookCard inline editing**: Verifies title, author, end page and target date are edited in place and saved as partial updates, that missing author/target date show an "add" prompt, that the tracking unit (pages/locations/percentage) can be changed, and that no separate Edit button appears. The target date is picked from a calendar that opens on the book's month, saves the chosen day, closes on Escape or an outside click without saving, and marks days other reading books already target.

## book-form-date.test.ts

Tests for picking the target date on the book form (used when editing a finished book) with the shared calendar.

- **BookForm target date calendar**: Verifies the picked day is what the form submits, that a set date can be cleared so none is saved (and no clear button appears without one), that opening the calendar doesn't submit the form, and that days other reading books target are marked while the book's own date is not.

## ordering.test.ts

Tests for arranging books in the reader's hand-picked order.

- **applyCustomOrder**: Verifies the saved order is followed, that with no saved order the list is newest-first, that books missing from the saved order (just added) go on top, and that stale saved IDs are ignored.
- **moveItem**: Verifies moving an item up or down, clamping past either end, and that the input list isn't mutated.

## book-sidebar-reorder.test.ts

Tests for reordering books in the Reading tab sidebar.

- **BookSidebar drag to reorder**: Verifies dragging up or down reports the new order, that ending a drag doesn't also select the book, that click jitter stays a click, that dropping in place reports nothing, and that Alt+Arrow keys move a book one place.
- **BookSidebar drag ghost**: Verifies a ghost of the dragged book follows the pointer (keeping the grab point under it) while its list slot shows as a placeholder, and that the ghost disappears on drop and never appears for a plain click.

## sort-controls.test.ts

Tests for the sort control shared by the Finished and Reading tabs.

- **SortControls**: Verifies the control is labelled "Sort", offers no Custom order on the Finished tab, reports a newly chosen field while keeping the direction, shows the direction as a bare arrow (named Ascending/Descending for screen readers and the tooltip), flips the direction when the arrow is clicked, and hides the arrow in Custom order.

## sorting.test.ts

Tests for how the Reading tab's sort options order books.

- **sortReadingBooks**: Verifies Custom keeps the hand-arranged order; title, date added, fraction read, target date and next-page-due sorts honor direction; undated and goal-met books go last either way; ties keep the custom order; and the input list is left untouched.

## active-books.test.ts

Tests for the Reading tab as a whole, with the backend stubbed.

- **Reading tab**: Verifies books follow the saved order, the first book's card shows without a click, moving the shown book keeps its card on screen, clicking another book switches the card, and moving a book saves the order.
- **Reading tab: sorting**: Verifies the list starts in Custom order with no direction arrow, offers the previous sorts plus Next Page Due, re-sorts by the chosen field and direction, puts the book whose next page is due soonest on top, and that moving a book while sorted switches back to Custom keeping the on-screen order. The control sits in the header beside Add Book, with no visible "Sort" caption but "Sort" as its name and tooltip.
- **Reading tab: Add Book**: Verifies Add Book creates an "Untitled Book" instead of opening a form, and that it appears at the top, selected, with its title ready to type over.
- **Dropdown** (`dropdown.test.ts`): Verifies the themed dropdown shows the current choice, stays as wide as its longest option whatever is selected, opens a list marking it by weight and color (no checkmark), reports a new choice (but not re-picking the current one), works by keyboard (arrows, Enter, Escape), and closes when clicking elsewhere.

## countdown.test.ts

Tests for the end-of-day countdown math.

- **formatCountdown**: Verifies seconds display as HH:MM:SS, dropping fractions and never going negative.
- **secondsUntilEndOfDay**: Verifies the time left until the reading end hour (local time), and that it is zero once that hour has passed.
- **secondsPerUnitDue**: Verifies the time left is spread over the units still needed for today's goal (pages, whole percent, or blocks of 100 locations), with nothing due once the goal is met.
- **nextCheckpoint**: Verifies the next mark to reach is one whole step (a page, or 100 locations) past the last step completed since the goal's start, capped at the goal's end, so part of a step doesn't move it; nothing once the goal is met.
- **nextDueDeadline**: Verifies the next checkpoint is due one even-pace interval from now for pages, only the unread part of a step for locations, and that nothing is due once today's goal is met.
- **paceUnitLabel**: Verifies each tracking type phrases one step as an amount for the pace ("1 page", "1%", "100 locations").
- **dueUnitLabel**: Verifies each tracking type names its due unit ("page", "1%", "100 locations").

## day-countdown.test.ts

Tests for the countdown row on the book card.

- **DayCountdown**: Verifies it shows the time left until the end of the reading day and until the next unit is due, ticks every second, names the unit for each tracking type, says "Goal met" once today's goal is reached, and stops its clock when removed. The next-due deadline counts down in real time beside a live "1 page every …" pace, and a new deadline starts when the old one passes without progress or when progress is logged. It also shows how much is left for today's goal in the book's own unit (pages, locations or percent), never below zero. For locations it counts down to the next 100-location checkpoint: logging less than that keeps the deadline, reaching it starts the next, and a missed one restarts toward the same checkpoint.

## calendar.test.ts

Tests for the pure calendar helpers behind the date picker.

- **toISODate / parseISODate**: Verifies local YYYY-MM-DD formatting and parsing (local midnight, never UTC, so the day cannot shift) and that the two round-trip.
- **monthGrid**: Verifies a month always yields six Sunday-first weeks (42 cells), starting on the Sunday on or before the 1st, with adjacent-month days flagged as outside the month, including across year boundaries.
- **addMonths**: Verifies stepping forward and back, year rollover in both directions, and multi-month deltas.
- **groupTargetDates**: Verifies books sharing a target date are grouped by date, and that the excluded book and books with no target date are skipped.

## date-picker.test.ts

Tests for the calendar panel used to choose a book's target date.

- **DatePicker month shown**: Verifies it opens on the chosen date's month (or today's when none is chosen) and shows the Su-Sa weekday header.
- **DatePicker grid**: Verifies 42 day buttons starting on a Sunday with outside-month days flagged, and a full-date accessible label on each.
- **DatePicker navigation**: Verifies the previous/next buttons change the month, including rolling over the year.
- **DatePicker selection**: Verifies clicking any day (including an adjacent-month one) reports its ISO date, and that the chosen day and today are marked.
- **DatePicker marked dates**: Verifies days other books target get the marked class, a "Target for: ..." tooltip and a screen-reader suffix, that unmarked days get none, and that the marker survives on selected or today cells.
- **DatePicker keyboard**: Verifies a single roving tab stop (selected day, else today, else the 1st), arrow/Page/Home/End movement that follows month boundaries and moves DOM focus, Enter/Space selecting, and Escape calling onClose.

## book-card-quick-add.test.ts

Tests for the +1 button on the Reading tab card.

- **BookCard quick-add**: Verifies the +1 is a tile beside the Update and Tracking controls, adds one unit per press, stops at the end of the book (and is disabled there), is disabled while a save is in flight, and is labelled for the book's unit (e.g. "+1%").

## quick-add-feedback.test.ts

Tests for the feedback shown when progress is logged, kept light because pages are often logged in quick bursts.

- **QuickAddTile hold to repeat** (`quick-add-hold.test.ts`): Verifies a short press adds just one; holding past the pause keeps adding, faster the longer it's held, shown in the running count and saved as one amount on release (with no extra 1 from the release's click); it stops at the most that can still be added, keeps the total if the press is cancelled, and stops counting once released; with holding off, a long press is just one. On the card, holding repeats only on location books, and a hold logs the whole amount as one update capped at the book's end.
- **QuickAddTile -1** (`quick-remove.test.ts`): Verifies the -1 sits under the +1 tile and removes one per press, the running count shows the burst's net change (negative styled as a correction), it does nothing while disabled, and when holding is enabled it repeats and saves the capped total once. Also covers the bar marking the slice just removed, numbers dipping on a decrease, and on the card: -1 lowers progress by one, is disabled at zero, a held -1 on a location book never goes below zero, and both bars and counts animate the decrease.
- **QuickAddTile running count**: Verifies each press adds one unit, a burst of presses shows a single running count ("+3"), the count clears a moment after the last press and restarts at +1, and presses while disabled are not counted.
- **ProgressBar glow on change**: Verifies the slice a bar just gained lights up, a burst grows one highlight that then disappears, and there is no glow on first show or when glowing is off.
- **BumpNumber**: Verifies the number lifts when it rises (it dips when it falls; see `quick-remove.test.ts`) but not when first shown.
- **BookCard +1 feedback**: Verifies that when progress goes up, both the overall and daily bars glow and both counts lift.
- **Daily goal persistence** (`daily-goal-persistence.test.ts`): Verifies a stored goal for today is what state shows after load (not a fresh default from current progress), goals saved for other dates are ignored, a newly created default goal is saved under today's date, setting a goal saves it under today's date, and a failed save keeps the goal in view while reporting an error.
- **Daily goal Start/End boxes** (`daily-goal-persistence.test.ts`): Verifies both boxes step in whole numbers, ignore the decimal-point, comma and exponent keys, put a pasted decimal back to the saved value without saving it, and still save a whole number.
