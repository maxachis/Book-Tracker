# Consolidate Frontends into Wails

## Goal

Replace the Wails scaffold frontend at `wails/frontend/` with the real Svelte app currently at `/src`. After this prompt, `wails build` should compile successfully (even if IPC calls still throw at runtime — those are addressed in later prompts).

## Context

- `wails/frontend/src/App.svelte` is the default Wails scaffold; it imports `Greet` from generated bindings that no longer exist in `wails/app.go`. This breaks `wails build`.
- The real app lives in `/src` (Svelte 5, TypeScript strict). It imports `@tauri-apps/*` APIs throughout `lib/services/`.
- Root `package.json` has the real dependencies (`@sveltejs/vite-plugin-svelte`, `svelte@^5`, testing deps, Tauri plugins).
- `wails.json` points `frontend:install` / `frontend:build` at `wails/frontend/`.

## Steps

1. Move `src/` contents into `wails/frontend/src/`, replacing the scaffold files (`App.svelte`, `main.ts`, `assets/`, `style.css`, `vite-env.d.ts`). Keep `wails/frontend/wailsjs/` — it's the generated binding output.
2. Merge dependencies into `wails/frontend/package.json`: pull Svelte + testing deps from the root `package.json`. Drop `@tauri-apps/cli` (Wails owns build), but **keep** `@tauri-apps/api`, `@tauri-apps/plugin-sql`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs` as temporary imports — we'll strip them in prompt 05. Remove the `tauri` script.
3. Update `wails/frontend/tsconfig.json`, `tsconfig.node.json`, `svelte.config.js`, and `vite.config.ts` to match the root versions' settings (Svelte 5 + strict TS). Preserve the Wails-specific dev server config if any.
4. Update imports in the moved files only if paths changed. The `wailsjs/go/main/App.js` path should resolve as `../../wailsjs/go/main/App.js` from `src/` (it already does).
5. Create a temporary `wails/frontend/src/lib/services/tauri-shim.ts` that re-exports `invoke` from `@tauri-apps/api/core` unchanged — we'll swap implementations in prompt 05 without touching call sites.
6. At the **repo root**, delete the old `src/` directory and `package.json` / `vite.config.ts` / `tsconfig.json` / `svelte.config.js` / `index.html` (these are Tauri-frontend-specific; the Wails tree now owns them). Double-check nothing else references them.
7. Verify: `cd wails/frontend && npm install && npm run build` should succeed. Then `cd wails && wails build -clean` (if CLI is installed locally) — it should at least pass the Vite step.

## Guardrails

- **Do not** modify `wails/app.go`, `wails/service/`, `wails/store/`, or any Go code. This prompt is frontend-only.
- **Do not** rewrite `invoke("…")` calls yet — they can still fail at runtime; we only need the build to succeed.
- **Do not** touch the Windows release workflow. It operates against `wails/frontend` already.
- Preserve `.gitignore` entries for `dist/`, `node_modules/`, etc. If the root `.gitignore` has Tauri-specific rules, move relevant ones into `wails/`.

## Acceptance

- [ ] `wails/frontend/npm run build` completes without errors.
- [ ] `wails build -clean` (if CLI available) reaches the Go compile step.
- [ ] No files remain under the root `src/`.
- [ ] One focused commit titled something like `Consolidate Svelte frontend into wails/`.
