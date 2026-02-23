## Purpose
Define how the app computes library-level reading statistics.

## Requirements
### Requirement: Compute aggregate book counts
The system SHALL compute total, active, and completed counts from the book collection.

#### Scenario: Aggregate counts
- **WHEN** statistics are calculated for a set of books
- **THEN** total count equals all books in scope
- **AND** completed count equals books with completion timestamps
- **AND** active count equals total minus completed

### Requirement: Compute completion rate as a percentage
The system SHALL compute completion rate as completed divided by total, rounded to one decimal place.

#### Scenario: Non-empty collection
- **WHEN** statistics are calculated for one or more books
- **THEN** completion rate equals `completed / total * 100` rounded to one decimal place

#### Scenario: Empty collection
- **WHEN** statistics are calculated for zero books
- **THEN** completion rate is `0`

### Requirement: Filter statistics by optional start date
The system SHALL support filtering books by creation timestamp when a statistics start date is configured.

#### Scenario: Start date set
- **WHEN** a statistics start date is configured
- **THEN** only books with `created_at >= start_date` are included in statistics

#### Scenario: Start date not set
- **WHEN** no statistics start date is configured
- **THEN** all books are included in statistics
