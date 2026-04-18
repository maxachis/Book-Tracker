# service tests

- **TestGenerateBookID_ReturnsUUIDv4**: Asserts `GenerateBookID` returns a 36-char UUIDv4 (four hyphens, `4` in the version position).
- **TestGenerateBookID_Unique**: Generates 1,000 IDs and checks there are no collisions — guards against an accidental switch to a deterministic or low-entropy generator.
- **TestValidateCreateBookRequest**: Table-driven cases covering the happy paths for each progress_type plus every rejection branch (empty/whitespace title, zero/negative total, unknown progress type).
- **TestCreateBook_PopulatesDefaults**: `CreateBook` populates a UUID id, zeroed progress, nil `completed_at`, and a non-empty `created_at`, and the new row is readable via the store.
- **TestCreateBook_RejectsInvalid**: Invalid requests (e.g., empty title) surface validation errors from `CreateBook`.
- **TestUpdateBook_MergesAndTriggersCompletion**: Sending only `current_progress` preserves other fields and sets `completed_at` when progress reaches total.
- **TestUpdateBook_ClearsCompletionWhenProgressDrops**: If `current_progress` drops below total after completion, `completed_at` is cleared.
- **TestUpdateBook_RejectsInvalidProgress**: Negative and over-total progress updates fail validation.
- **TestUpdateBook_NotFound**: Updating a missing id returns an error.
- **TestMarkBookComplete**: Sets `current_progress = total_progress` and stamps `completed_at`.
