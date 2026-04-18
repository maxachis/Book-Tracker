# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Book Tracker** — desktop app for tracking reading progress and goals.

Currently mid-migration from **Tauri 2.0 + Rust** to **Wails v2 + Go**. Both trees coexist during the port:

- `src-tauri/` — original Rust backend (being retired)
- `wails/` — new Go backend (active development)
- `src/` — shared Svelte 5 frontend (reused across both)

Prefer working in `wails/` for new backend work. Don't port features to Go until there is a passing test covering them (red-green TDD).

## Build & Development Commands

```bash
# Go backend (from wails/)
cd wails && go build ./...        # compile
cd wails && go test ./...         # run all tests
cd wails && go vet ./...          # static analysis
cd wails && go mod tidy           # sync deps

# Wails dev (once wails CLI is installed)
cd wails && wails dev             # hot reload, opens desktop window
cd wails && wails build           # production binary

# Frontend only
npm run dev                       # vite dev server on :1420
npm run check                     # svelte-check / tsc
```

Install Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

## Architecture

### Backend (`wails/`)
Flat layout (small project, single binary):

```
wails/
├── main.go          # Wails bootstrap, wires App into the runtime
├── app.go           # App struct — methods exposed to the frontend become IPC endpoints
├── store/           # SQLite persistence (modernc.org/sqlite, pure Go, no CGo)
├── model/           # Book, Settings structs with JSON tags
├── service/         # business logic: validation, calculations, CSV import/export
└── migrations/      # embedded SQL schema migrations (//go:embed)
```

Exposed methods on `App` become callable from the frontend via `window.go.main.App.MethodName(...)`. Keep them thin — validate input, delegate to `service`, return typed structs.

### Frontend (`src/`)
- Svelte 5 with TypeScript (strict mode)
- Reactive state classes in `lib/stores/state.svelte.ts`
- Replace `invoke(...)` calls with the Wails-generated bindings during the port
- Reading goal math lives in `lib/services/calculations.ts` — mirror this in Go `service/` and pick one home (prefer Go so logic is testable without a browser)

### Data Model
- Books: `id`, `title`, `author`, `total_progress`, `current_progress`, `progress_type` (`page` | `location` | `percentage`), `target_date`, timestamps
- Settings: reading hours config, goal targets
- Auto-complete when `current_progress >= total_progress`
- SQLite file: `book-tracker.db` under `os.UserConfigDir()/book-tracker/`

## Go Code Style

- Format with `gofmt` / `goimports` — never hand-format
- Lint with `golangci-lint`; fix warnings rather than silencing
- Package names: short, lowercase, no underscores (`store`, not `data_store`)
- Wrap errors with context: `fmt.Errorf("load book %s: %w", id, err)`
- Return errors, don't panic (except unrecoverable startup config)
- Never ignore errors silently — if truly safe, `_ = f.Close() // best-effort` with a reason

## Testing

- Tests live beside source as `*_test.go`
- Table-driven with `t.Run` subtests
- White-box (`package foo`) unless you specifically need black-box
- Use `t.TempDir()` for filesystem fixtures
- Prefer real dependencies over mocks — in-memory SQLite (`:memory:`) beats a mocked DB interface
- API/IPC-endpoint tests: include one with an in-memory DB and one against a real file-backed SQLite instance
- Each `tests/` directory gets a `TESTS.md` with a 1-2 sentence description per test; keep it current

## Cross-Platform Paths

- **Never hardcode user-data paths.** Use `os.UserConfigDir()` for the DB, `os.UserCacheDir()` for caches, `t.TempDir()` in tests
- Use `filepath.Join`, not string concatenation with `/`
- OS-specific logic goes in `_linux.go` / `_windows.go` files when it grows past a few branches

## Dependencies

- Manage via `go.mod`; run `go mod tidy` before committing
- Pin specific versions; avoid `latest` in imports
- Stdlib first, then well-maintained third-party
- SQLite: `modernc.org/sqlite` (pure Go — avoids CGo and keeps Windows cross-compile simple)

## TDD Workflow

Red → Green → Refactor. Write the failing test first, confirm it fails for the right reason, implement the minimum to pass, then clean up. Rerun `go test ./...` after every change.

## Releasing

GitHub Actions workflow (`.github/workflows/release.yml`) builds the Windows installer on tag push. Scoop manifest auto-updates at `bucket/book-tracker.json`.

```bash
git tag v0.2.0
git push --tags
```

During the migration, keep releasing from the Tauri build until the Go port reaches feature parity.

## Devcontainer Safety

When running inside a devcontainer, killing processes carelessly will bring down the entire container.

- **NEVER** use broad process-killing commands: `pkill -f`, `killall`, `kill -9 -1`, `fuser -k`
- Free a port by identifying the exact PID, verifying it is not critical, then killing only that PID:
  ```bash
  lsof -ti :<PORT>
  ps -p <PID> -o pid,comm,args
  kill <PID>
  ```
- **NEVER kill PID 1** or any `vscode-server` process
- If a port is in use and you can't identify the process, ask the user

## Mistakes

_(project-specific gotchas — add entries here when you hit a non-obvious pitfall during the port)_
