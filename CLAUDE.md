# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development with hot reload
npm run tauri dev

# Production build
npm run tauri build

# TypeScript type checking
npm run check

# Frontend only (dev server on port 1420)
npm run dev
```

## Architecture

**Tauri 2.0 desktop app** with Svelte 5 frontend and Rust backend, using SQLite for persistence.

### Frontend (src/)
- **Svelte 5** with TypeScript in strict mode
- State management via Svelte 5 reactive classes in `lib/stores/state.svelte.ts`
- Database queries in `lib/services/database.ts` using `@tauri-apps/plugin-sql`
- Reading goal calculations in `lib/services/calculations.ts`

### Backend (src-tauri/src/)
- Tauri command handlers in `commands/` (IPC endpoints)
- Data models in `models/` (Book, Settings with serde serialization)
- Database migrations in `db/migrations.rs` (auto-run on startup)

### Frontend-Backend Communication
Frontend calls Rust via `invoke("command_name", { args })` from `@tauri-apps/api/core`. Commands validate input and return typed responses.

Key commands: `generate_book_id`, `validate_book_request`, `validate_progress_update`, `parse_csv_books`, `generate_csv_export`

## Key Patterns

- Progress types: `page`, `location`, `percentage` (for physical books, Kindle, any format)
- Books auto-complete when `current_progress >= total_progress`
- Reading goals calculate pages/day and pages/hour based on target date and configured reading hours
- SQLite database: `book-tracker.db` with tables `books` and `user_settings`

## Testing Guidance
- Apply Test-Driven Development: Develop a test that fails, then implement functionality that causes it to pass.
    - After any change, rerun all tests to ensure functionality.
- Tests of API Endpoints should always include at least two tests: one which mocks the database, and one which uses a live database.
- In every `tests`, add a `TESTS.md` file that provides a 1-2 sentence description for every test in the directory. Keep this updated as tests are added, modified, or removed.
