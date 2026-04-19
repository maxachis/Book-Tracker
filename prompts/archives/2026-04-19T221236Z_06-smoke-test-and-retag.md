# Smoke Test & Re-tag v0.2.0

## Goal

Verify the ported Wails app works end-to-end, then cut the release tag so the Windows workflow produces a real installer.

## Prerequisites

Prompts 01–05 archived. `wails build` succeeds locally. `go test ./...` and `npm run check` both pass.

## Steps

1. **Local smoke test.**
   - `cd wails && wails build -clean`.
   - Launch `wails/build/bin/book-tracker` (Linux) or the `.exe` (Windows).
   - Walk the golden path: add a book (all three `progress_type` values), update progress, mark complete, delete, tweak settings, import a small CSV, export a CSV. Confirm the DB file at `os.UserConfigDir()/book-tracker/book-tracker.db` persists across restarts.
   - Cross-check the dev-tools console — no uncaught exceptions during normal use.
2. **Retire the Tauri tree (optional but recommended).**
   - Now that the Wails port has feature parity, consider deleting `src-tauri/` and the Tauri-related section of `CLAUDE.md`. Defer if the user wants one last Tauri release — confirm before deleting.
3. **Confirm CI green.** Push any pending commits to `main`; wait for existing workflows (if any run on `main`) to pass.
4. **Tag and push.**
   ```bash
   git tag -a v0.2.0 -m "Release v0.2.0"
   git push origin v0.2.0
   ```
5. **Watch the release workflow.**
   ```bash
   gh run watch $(gh run list --workflow=release.yml --limit=1 --json databaseId -q '.[0].databaseId')
   ```
   Expect: build-windows green, release created, scoop manifest updated on `main`.
6. **Verify the release.**
   - `gh release view v0.2.0 --web` — confirm `book-tracker.exe` is attached.
   - Sanity-check `bucket/book-tracker.json` on `main` shows the new version + hash.

## Rollback

If CI fails, **delete the tag** (`git tag -d v0.2.0 && git push origin :refs/tags/v0.2.0`) before any release artifacts are published. Fix, commit, re-tag. Never force-push a tag that has an associated release.

## Acceptance

- [ ] Local smoke test covers add/update/complete/delete/settings/CSV without errors.
- [ ] `v0.2.0` tag pushed.
- [ ] Release workflow finishes green.
- [ ] `book-tracker.exe` attached to `v0.2.0`.
- [ ] Scoop manifest auto-committed to `main` with the new version + hash.
