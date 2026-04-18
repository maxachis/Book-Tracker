# Replace File-System & Dialog Calls with Wails Runtime

## Goal

Remove the frontend's dependency on `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` by exposing equivalent operations through Go methods on `App` that use the Wails runtime (`github.com/wailsapp/wails/v2/pkg/runtime`) and `os` stdlib.

## Context

`wails/frontend/src/lib/services/csv.ts` currently uses:

```ts
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
```

- `open({ filters, multiple:false })` → shows a native open-file dialog, returns path or null.
- `save({ filters })` → native save dialog, returns path or null.
- `readTextFile(path)` → file contents as UTF-8 string.
- `writeTextFile(path, contents)` → write UTF-8 string.

Wails exposes `runtime.OpenFileDialog(ctx, OpenDialogOptions{...})` and `runtime.SaveFileDialog(ctx, SaveDialogOptions{...})`. Stdlib gives us `os.ReadFile` / `os.WriteFile`.

## Steps

1. On `App`, add:
   - `OpenCSVFile() (string, error)` — returns file **contents** (not path), using `runtime.OpenFileDialog` with a `.csv` filter. Returns `("", nil)` if the user cancels.
   - `SaveCSVFile(defaultFilename, contents string) (saved bool, err error)` — shows `runtime.SaveFileDialog`, writes `contents` to the chosen path, returns `(false, nil)` on cancel.
2. Both methods need `a.ctx` (set in `(*App).startup`). Add a guard returning a clear error if `ctx` is nil (helps tests and early invocations).
3. Do **not** try to unit-test dialog code — it requires a live runtime. Instead, factor the file I/O into a small helper (`writeStringToFile(path, contents)`) that is testable with `t.TempDir()`, and cover that.
4. Update `wails/frontend/src/lib/services/csv.ts` so it imports neither `@tauri-apps/plugin-dialog` nor `@tauri-apps/plugin-fs`. All file I/O should go through the `App` methods via the generated bindings (actual rewiring of `invoke("…")` for parse/export happens in prompt 05 — here we only change the dialog + fs imports).
5. Remove `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` from `wails/frontend/package.json`. Run `npm install` and ensure no stray references remain (`grep -rn "plugin-dialog\|plugin-fs" wails/frontend/src` should be empty).

## Guardrails

- **Do not** swap `invoke("parse_csv_books", …)` call sites — that's prompt 05's job.
- **Do not** introduce a new abstraction layer in `csv.ts`. Keep it thin: call `window.go.main.App.OpenCSVFile()` and feed the result to the existing parser flow.
- Errors from Go file I/O must wrap context: `fmt.Errorf("write csv to %s: %w", path, err)`.

## Acceptance

- [ ] `App` exposes `OpenCSVFile` and `SaveCSVFile`.
- [ ] `wails/frontend/src/lib/services/csv.ts` no longer imports `@tauri-apps/plugin-dialog` or `@tauri-apps/plugin-fs`.
- [ ] `wails/frontend/package.json` no longer lists those packages.
- [ ] Unit test for `writeStringToFile` (or equivalent helper) passes.
- [ ] `wails build -clean` succeeds.
