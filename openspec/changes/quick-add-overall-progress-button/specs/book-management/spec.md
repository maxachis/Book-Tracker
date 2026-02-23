## MODIFIED Requirements

### Requirement: Update book fields and progress safely
The system SHALL allow partial updates to existing books and validate progress bounds for updates, including incremental quick-add updates from the Overall Progress View.

#### Scenario: Update progress within bounds
- **WHEN** a user updates a book's current progress to a value between zero and total progress
- **THEN** the system persists the update

#### Scenario: Reject out-of-bounds absolute update
- **WHEN** a user updates current progress to a negative value or a value greater than total progress
- **THEN** the system rejects the update with a validation error

#### Scenario: Quick-add increments progress by one unit
- **WHEN** a user activates quick-add in the Overall Progress View for a book with current progress below total progress
- **THEN** the system updates current progress by exactly one unit of the book's progress type
- **AND** persists the updated progress

#### Scenario: Quick-add clamps at total progress
- **WHEN** a user activates quick-add and current progress plus one unit would exceed total progress
- **THEN** the system sets current progress to total progress
- **AND** does not persist a value greater than total progress

#### Scenario: Quick-add at total is a no-op
- **WHEN** a user activates quick-add for a book already at total progress
- **THEN** the system keeps current progress at total progress
- **AND** does not return a validation error
