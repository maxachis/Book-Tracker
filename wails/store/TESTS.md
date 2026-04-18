# store tests

- **TestOpen_InMemory_AppliesSchema**: Opens an in-memory SQLite store and verifies the migration seeded the default `user_settings` row.
- **TestOpen_FileBacked_PersistsAcrossReopen**: Writes a book to a file-backed DB under `t.TempDir()`, reopens the store, and confirms the row survived — covering the real sqlite driver path that the in-memory test skips.
- **TestInsertBook_AndGetBook**: Inserts a book and reads it back, asserting every scanned field (including nilable `author`) round-trips correctly.
- **TestGetBook_NotFound**: `GetBook` on a missing id returns an error wrapping `ErrNotFound`.
- **TestListActiveBooks_FiltersCompleted**: Verifies `ListActiveBooks` excludes rows with a `completed_at`, `ListCompletedBooks` includes only those, and `ListAllBooks` returns both.
- **TestListActiveBooks_OrderedByCreatedDesc**: Confirms active list is sorted by `created_at` DESC.
- **TestUpdateBook_PersistsFields**: Mutates title, current_progress, and completed_at and re-reads to confirm persistence.
- **TestUpdateBook_ClearsCompletedAt**: Writing a nil `completed_at` clears a previously-set value.
- **TestDeleteBook**: Deleting removes the row so subsequent reads fail.
- **TestBooksCRUD_FileBacked**: Runs insert + list against a real on-disk SQLite DB.
