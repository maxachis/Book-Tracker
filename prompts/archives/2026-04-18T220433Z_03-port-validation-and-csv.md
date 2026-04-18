# Port Validation & CSV Commands to Go

## Goal

Replace the remaining non-DB Tauri commands with Go implementations on `App`, covering progress/settings validation and CSV import/export logic. Red-green TDD: tests first, then implementation.

## Context

The Tauri frontend currently invokes these command names (see grep for `invoke(` in `wails/frontend/src/lib/services/`):

- `validate_progress_update` — throws if `current > total` or `progress_type` rules fail.
- `validate_settings` — throws on invalid reading hours / start date.
- `get_current_timestamp` — returns an ISO-8601 string (prompt 02 already uses this internally; exposing via a helper keeps frontend behavior identical).
- `parse_csv_books` — parses a CSV string into `CsvBookRecord[]`.
- `check_duplicates` — flags CSV rows that collide with existing books (by `title + author`).
- `generate_csv_export` — serializes `Book[]` to CSV text.

The current Rust implementations live in `src-tauri/src/commands/` — use them as the behavioral reference. Do **not** copy Rust verbatim; write idiomatic Go.

## Steps

1. For each validator, add a table-driven test in `wails/service/books_test.go` (or a new `validation_test.go`) covering the boundaries the Rust version enforces (zero, negative, overflow, percentage caps at 100, invalid start_hour/end_hour pairs, stats_start_date format).
2. Implement the validators in `wails/service/` as pure functions returning `error` (no receiver needed).
3. Expose each on `App` as `ValidateProgressUpdate(...) string` and `ValidateSettings(...) string`, returning `""` on success and the error message otherwise — matching the existing `ValidateCreateBookRequest` pattern.
4. Add `NowTimestamp() string` on `App` returning `time.Now().UTC().Format(time.RFC3339)`.
5. For CSV: create `wails/service/csv.go` with pure functions `ParseCSVBooks(content string) ([]CSVBookRecord, error)` and `GenerateCSVExport(books []model.Book) (string, error)`. Define `CSVBookRecord` in `wails/model/csv.go` with JSON tags matching the TS `CsvBookRecord` shape.
6. Implement duplicate detection as `CheckDuplicates(records []model.CSVBookRecord, existing []model.Book) []DuplicateReport` (pure function) so it tests without a DB; the `App` wrapper queries `ListAllBooks` and delegates.
7. Expose CSV methods on `App`: `ParseCSVBooks`, `GenerateCSVExport`, `CheckDuplicates` (the wrapper that reads existing books internally). Names must match what prompt 05 will wire up.
8. Keep each test focused (one behavior per subtest).

## Guardrails

- **Do not** modify frontend files.
- **Do not** call into the Wails `runtime` package here — these functions are pure logic, testable without a running window.
- CSV parsing uses the stdlib `encoding/csv`. Do not add a third-party CSV library.
- Preserve header order in export so existing import/export roundtrips stay stable: `title,author,total_progress,current_progress,progress_type,target_date,completed_at,created_at` (confirm against `src-tauri/src/commands/csv.rs`).
- Any newly added service file gets corresponding `*_test.go` with `TESTS.md` updated.

## Acceptance

- [ ] All new methods have tests that fail first, then pass after implementation.
- [ ] `go test ./...` and `go vet ./...` pass.
- [ ] Round-trip test: `ParseCSVBooks(GenerateCSVExport(books))` yields equivalent records.
- [ ] `App` exposes `ValidateProgressUpdate`, `ValidateSettings`, `NowTimestamp`, `ParseCSVBooks`, `GenerateCSVExport`, `CheckDuplicates`.
- [ ] Commit per logical group (validators together, CSV together).
