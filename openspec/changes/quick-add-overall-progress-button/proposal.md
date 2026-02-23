## Why

Updating overall progress currently requires manually editing the absolute progress value, which is slower during frequent reading updates. A quick-add action in the Overall Progress View reduces friction and helps users log incremental progress consistently.

## What Changes

- Add a quick-add control in the Overall Progress View directly below the UPDATE section, right-justified to align with the existing Daily Goal reset control pattern.
- Enable users to increment overall progress by one unit of the book's configured progress type (`page`, `percentage`, or `location`) without manually typing a new absolute value.
- Keep existing progress validation behavior so quick-add updates cannot exceed total progress and continue to trigger completion behavior when reaching total progress.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `book-management`: Extend progress update behavior to include an explicit incremental update action from the Overall Progress View while preserving existing bounds validation and completion-state handling.

## Impact

- Affected specs: `openspec/specs/book-management/spec.md` (delta required).
- Affected code: Overall Progress UI component(s), progress update action handler, and related progress update tests.
- No API or external dependency changes expected.
