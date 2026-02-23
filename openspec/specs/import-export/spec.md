## Purpose
Define CSV export and import behavior, including validation and duplicate handling.

## Requirements
### Requirement: Export all books to CSV
The system SHALL export all books to CSV with a fixed header and full progress metadata.

#### Scenario: Generate export CSV
- **WHEN** a user initiates export
- **THEN** the system emits CSV with header columns `title,author,current_progress,total_progress,progress_type,target_date,completed_at`
- **AND** writes one row per stored book

### Requirement: Parse and validate imported CSV records
The system SHALL parse CSV rows into import records and validate supported progress types.

#### Scenario: Parse valid rows
- **WHEN** CSV rows include valid progress type values
- **THEN** the system parses rows into import records

#### Scenario: Reject invalid progress type
- **WHEN** an imported row includes progress type outside `page`, `location`, `percentage`
- **THEN** the system rejects import parsing with an error

### Requirement: Reject duplicate imports by title and author
The system SHALL reject imports containing books that duplicate existing records by case-insensitive title and author comparison.

#### Scenario: Duplicate found
- **WHEN** any imported row matches an existing book title and author pair (case-insensitive)
- **THEN** the system rejects the import as duplicate

#### Scenario: No duplicates found
- **WHEN** imported rows do not match existing title-author pairs
- **THEN** the system allows import to proceed
