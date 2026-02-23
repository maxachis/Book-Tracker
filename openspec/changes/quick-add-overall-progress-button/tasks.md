## 1. Overall Progress UI

- [x] 1.1 Locate the Overall Progress View update section and add a right-justified quick-add control directly below UPDATE.
- [x] 1.2 Set quick-add label/content to reflect the active progress unit (page, percentage, or location) without changing existing layout semantics.
- [x] 1.3 Prevent rapid duplicate submissions by disabling or serializing quick-add while a progress update is in flight.

## 2. Progress Update Behavior

- [x] 2.1 Implement quick-add to compute `nextProgress = min(currentProgress + 1, totalProgress)`.
- [x] 2.2 Route quick-add through the existing progress update handler so existing validation and completion logic are reused.
- [x] 2.3 Ensure quick-add at total progress is a no-op and does not produce validation errors.

## 3. Verification

- [x] 3.1 Add/update tests for quick-add increment behavior when current progress is below total.
- [x] 3.2 Add/update tests for clamp-to-total behavior when one increment would exceed total.
- [x] 3.3 Add/update tests for no-op behavior when current progress already equals total.
- [x] 3.4 Add/update UI tests (or interaction tests) validating placement and action wiring for the new quick-add control.
