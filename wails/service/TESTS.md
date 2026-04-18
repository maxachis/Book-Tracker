# service tests

- **TestGenerateBookID_ReturnsUUIDv4**: Asserts `GenerateBookID` returns a 36-char UUIDv4 (four hyphens, `4` in the version position).
- **TestGenerateBookID_Unique**: Generates 1,000 IDs and checks there are no collisions — guards against an accidental switch to a deterministic or low-entropy generator.
- **TestValidateCreateBookRequest**: Table-driven cases covering the happy paths for each progress_type plus every rejection branch (empty/whitespace title, zero/negative total, unknown progress type).
