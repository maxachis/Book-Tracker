## Purpose
Define top-level application navigation, view switching, loading states, and active-book sorting behavior.

## Requirements
### Requirement: Support primary application views
The system SHALL provide top-level navigation for Active Books, Completed Books, Settings, and Import/Export views.

#### Scenario: Switch active view
- **WHEN** a user selects a navigation option
- **THEN** the corresponding top-level view is rendered

### Requirement: Load initial application data at startup
The system SHALL load active books, completed books, and settings during app initialization.

#### Scenario: Successful initial load
- **WHEN** the app starts
- **THEN** the system requests active books, completed books, and settings
- **AND** renders content after loading completes

#### Scenario: Initial load failure
- **WHEN** loading data fails
- **THEN** the system shows an error state with dismiss capability

### Requirement: Refresh collections after book mutations
The system SHALL refresh book collections after create, update, delete, and mark-complete actions from the active books view.

#### Scenario: Mutation followed by refresh
- **WHEN** a book mutation succeeds
- **THEN** the system reloads active and completed collections before returning to steady state

### Requirement: Sort active books by configurable criteria
The system SHALL support sorting active books by title, target date, progress percentage, or creation date in ascending or descending direction.

#### Scenario: Sort by target date
- **WHEN** sorting by target date is selected
- **THEN** books with dates are ordered by date according to direction
- **AND** books without target dates are placed after dated books
