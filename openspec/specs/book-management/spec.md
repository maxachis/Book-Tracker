## Purpose
Define how books are created, updated, completed, deleted, and grouped into active versus completed collections.

## Requirements
### Requirement: Create books with validated progress inputs
The system SHALL create a book with a generated identifier, zero starting progress, and validated input fields.

#### Scenario: Create a valid book
- **WHEN** a user submits a title, total progress greater than zero, and a progress type of `page`, `location`, or `percentage`
- **THEN** the system creates a new book with `current_progress = 0`
- **AND** the book is assigned a generated id and creation timestamp

#### Scenario: Reject invalid create input
- **WHEN** a user submits an empty title, non-positive total progress, or unsupported progress type
- **THEN** the system rejects the request with a validation error

### Requirement: Update book fields and progress safely
The system SHALL allow partial updates to existing books and validate progress bounds for updates.

#### Scenario: Update progress within bounds
- **WHEN** a user updates a book's current progress to a value between zero and total progress
- **THEN** the system persists the update

#### Scenario: Reject out-of-bounds progress
- **WHEN** a user updates current progress to a negative value or a value greater than total progress
- **THEN** the system rejects the update with a validation error

### Requirement: Track completion state from progress
The system SHALL automatically set completion when progress reaches total and clear completion when progress is reduced below total.

#### Scenario: Auto-complete on reaching total
- **WHEN** a book update sets `current_progress >= total_progress` and the book is not already completed
- **THEN** the system records a completion timestamp

#### Scenario: Reopen a previously completed book
- **WHEN** a completed book is updated to `current_progress < total_progress`
- **THEN** the system clears the completion timestamp

### Requirement: Support explicit completion and deletion actions
The system SHALL support explicit completion and permanent deletion operations.

#### Scenario: Mark complete action
- **WHEN** a user marks a book complete
- **THEN** the system sets current progress to total progress
- **AND** the system records a completion timestamp

#### Scenario: Delete book action
- **WHEN** a user deletes a book
- **THEN** the system permanently removes the book record

### Requirement: Separate active and completed book views
The system SHALL expose active and completed book lists as distinct collections.

#### Scenario: Active books query
- **WHEN** active books are requested
- **THEN** only books without a completion timestamp are returned
- **AND** results are ordered by creation time descending

#### Scenario: Completed books query
- **WHEN** completed books are requested
- **THEN** only books with a completion timestamp are returned
- **AND** results are ordered by completion time descending
