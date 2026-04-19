# Prompts Folder

Reusable prompt files for Claude to execute on demand. Each `*.md` is a self-contained task.

## Workflow

1. Pick the prompt to run (the numbered prefix is the intended execution order for the Wails migration).
2. Execute the task described in the file, following project rules (TDD per root `CLAUDE.md`).
3. On successful completion, move the file into `archives/` with a UTC timestamp prefix: `YYYY-MM-DDTHHMMSSZ_<original-name>.md`.
4. If execution fails or is aborted, leave the file in place for retry.

## Notes

- Name by intent, not by date — the archive carries history.
- Keep the root limited to prompts that are still pending or actively reused.
- Prompts in this directory assume the project's TDD workflow: red → green → refactor, one concern per commit.
