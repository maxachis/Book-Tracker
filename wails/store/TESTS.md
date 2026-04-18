# store tests

- **TestOpen_InMemory_AppliesSchema**: Opens an in-memory SQLite store and verifies the migration seeded the default `user_settings` row.
- **TestOpen_FileBacked_PersistsAcrossReopen**: Writes a book to a file-backed DB under `t.TempDir()`, reopens the store, and confirms the row survived — covering the real sqlite driver path that the in-memory test skips.
