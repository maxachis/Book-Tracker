# Book Tracker

## Overview

A desktop application for tracking reading progress across multiple books, calculating daily reading goals, and maintaining a reading history.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Rust |
| Frontend | Svelte |
| Framework | Tauri |
| Database | SQLite |
| Distribution | Native executable |

## Data Models

### Book

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| title | String | Yes | Book title |
| author | String | No | Book author |
| current_progress | Integer | Yes | Current position (page, location, or percentage value) |
| total_progress | Integer | Yes | End position (page, location, or percentage value) |
| progress_type | Enum | Yes | One of: `page`, `location`, `percentage` |
| target_date | Date | No | Date by which to finish the book |
| completed_at | Date | No | Date the book was marked complete |
| created_at | DateTime | Yes | When the book was added |

### User Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| reading_start_hour | Integer | 8 | Start of daily reading window (0-23) |
| reading_end_hour | Integer | 22 | End of daily reading window (0-23) |
| stats_start_date | Date | None | Start date for statistics calculations |

## Features

### 1. Book Management

#### Add Book
- User provides title and optionally author
- User sets current progress and total progress
- User selects progress type (page, location, or percentage)
- User optionally sets a target completion date

#### Update Progress
- User can update current progress at any time
- User can switch progress type (page ↔ location ↔ percentage)
- When switching types, user must re-enter current and total values

#### Delete Book
- User can permanently delete a book from the system

#### Mark Complete
- User can mark a book as complete
- System records the completion date automatically

### 2. Reading Goals

#### Daily Reading Calculation
When a book has a target date set:
```
remaining = total_progress - current_progress
days_remaining = target_date - today
pages_per_day = remaining / days_remaining
```

#### Hourly Reading Calculation
Based on user-configured reading hours:
```
available_hours = reading_end_hour - reading_start_hour
pages_per_hour = pages_per_day / available_hours
```

#### Overdue Indicator
- Books past their target date without completion display a visual overdue indicator

### 3. Active Books View

#### Display
- Shows all books that are not marked complete
- Default sort: by target date (earliest first, books without dates at end)

#### Sorting Options
- Target date (default)
- Title (alphabetical)
- Progress (percentage complete)
- Date added

#### Information Shown Per Book
- Title and author
- Current progress / total progress
- Target date (if set)
- Pages per day required (if target date set)
- Pages per hour required (if target date set)
- Overdue indicator (if applicable)

### 4. Import/Export

#### Export Format (CSV)
```csv
title,author,completed_on
"Book Title","Author Name","2025-01-15"
```

#### Import
- Accepts CSV in the export format
- Imported books are added as completed records
- Duplicate handling: Reject

### 5. Statistics

#### Book Completion Rate
- Calculates average number of days required to complete book
- User can configure the start date for this calculation
- Formula: `completed_books / dayss_since_start_date`

## User Interface

### Views

1. **Active Books** - Primary view showing in-progress books
2. **Completed Books** - Historical view of finished books
3. **Settings** - Configure reading hours and statistics start date
4. **Import/Export** - Data management

## Open Questions

1. **Duplicate import handling** - Should importing reject duplicates, skip them silently, or allow duplicate entries?