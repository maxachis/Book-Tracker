## Purpose
Define how user settings are stored, validated, and used by the application.

## Requirements
### Requirement: Provide default settings
The system SHALL maintain a singleton user settings record with defaults when no customized values are present.

#### Scenario: Default settings available
- **WHEN** settings are requested before customization
- **THEN** the system returns start hour `8`, end hour `22`, and no statistics start date

### Requirement: Validate hour ranges
The system SHALL enforce valid hour values for submitted settings updates.

#### Scenario: Hour out of range
- **WHEN** a settings update includes a start or end hour outside `0..23`
- **THEN** the system rejects the update with a validation error

#### Scenario: Invalid start/end ordering in same request
- **WHEN** a settings update includes both start and end hour and start is not less than end
- **THEN** the system rejects the update with a validation error

### Requirement: Support partial settings updates
The system SHALL allow updating any subset of settings fields.

#### Scenario: Update statistics start date only
- **WHEN** a settings update includes only `stats_start_date`
- **THEN** the system updates only that field and preserves other values

#### Scenario: Update reading window only
- **WHEN** a settings update includes one or both reading-hour fields
- **THEN** the system updates provided fields and preserves omitted fields
