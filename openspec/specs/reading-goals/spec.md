## Purpose
Define how the app computes reading pace targets from progress, target dates, reading-hour settings, and optional daily goals.

## Requirements
### Requirement: Reading goals require an active target date
The system SHALL return no calculated reading goal when a book has no target date or is already completed.

#### Scenario: Missing target date
- **WHEN** a book has no target completion date
- **THEN** the system returns no reading goal values for that book

#### Scenario: Completed book
- **WHEN** a book has a completion timestamp
- **THEN** the system returns no reading goal values for that book

### Requirement: Compute daily and hourly pace from remaining work
The system SHALL compute required pages per day and per hour using remaining progress, days to target, and configured reading window.

#### Scenario: Future target date
- **WHEN** a book has remaining progress and a future target date
- **THEN** the system computes `pagesPerDay = remaining / daysRemaining`
- **AND** computes `pagesPerHour = pagesPerDay / availableHours` when available hours are positive

#### Scenario: Zero available reading hours
- **WHEN** reading start and end hour produce zero available hours
- **THEN** the system sets `pagesPerHour` equal to `pagesPerDay`

### Requirement: Flag overdue targets
The system SHALL mark books overdue when target date is today or earlier and remaining progress is non-zero.

#### Scenario: Overdue calculation
- **WHEN** days remaining is zero or negative
- **THEN** the system marks the goal as overdue
- **AND** returns `daysRemaining = 0`

### Requirement: Calculate today's pace separately
The system SHALL compute a `pagesPerHourToday` value based on remaining hours in today's reading window.

#### Scenario: Reading window already closed
- **WHEN** current time is at or after reading end hour
- **THEN** the system returns no `pagesPerHourToday` value

#### Scenario: Daily goal provided
- **WHEN** a daily goal range exists for the book
- **THEN** `pagesPerHourToday` is based on pages remaining to today's daily goal endpoint
- **AND** if the daily goal endpoint is already reached, `pagesPerHourToday` is zero

#### Scenario: Daily goal not provided
- **WHEN** no daily goal exists
- **THEN** `pagesPerHourToday` is derived from overall remaining work and days remaining
