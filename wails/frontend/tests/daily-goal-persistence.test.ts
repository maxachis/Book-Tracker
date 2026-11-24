import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/svelte";
import type { Book } from "../src/lib/types";
import { localDateISO } from "../src/lib/services/dates";

const backend = vi.hoisted(() => ({
  books: [] as Book[],
  goals: [] as { book_id: string; date: string; start: number; end: number }[],
  setDailyGoal: vi.fn(),
  failSave: false,
}));

vi.mock("../wailsjs/go/main/App", () => {
  const ok = <T>(v: T) => Promise.resolve(v);
  return {
    ListActiveBooks: () => ok(backend.books),
    ListCompletedBooks: () => ok([]),
    ListAllBooks: () => ok(backend.books),
    GetSettings: () => ok({ id: 1, reading_start_hour: 8, reading_end_hour: 22, stats_start_date: null }),
    GetDailyReadingSummary: (date: string) => ok({ date, books: [] }),
    GetBookOrder: () => ok([]),
    GetDailyGoals: (date: string) => ok(backend.goals.filter((g) => g.date === date)),
    SetDailyGoal: (goal: unknown) => {
      backend.setDailyGoal(goal);
      return backend.failSave ? Promise.reject(new Error("disk full")) : ok(undefined);
    },
  };
});

import ActiveBooks from "../src/views/ActiveBooks.svelte";
import { appState } from "../src/lib/stores/state.svelte";

const today = localDateISO();

function book(id: string, current: number): Book {
  return {
    id,
    title: `Book ${id}`,
    author: null,
    current_progress: current,
    total_progress: 500,
    progress_type: "page",
    target_date: null,
    completed_at: null,
    created_at: "2026-01-01T00:00:00Z",
  };
}

beforeEach(() => {
  backend.books = [book("a", 120)];
  backend.goals = [];
  backend.failSave = false;
  backend.setDailyGoal.mockClear();
  appState.dailyGoals = new Map();
  appState.error = null;
});

describe("daily goal persistence", () => {
  // Pages read earlier today must still count after a restart, so the goal's
  // start must be the stored one (100), not the book's current page (120).
  it("keeps today's goal after the app is reopened", async () => {
    backend.goals = [{ book_id: "a", date: today, start: 100, end: 150 }];
    await appState.loadData();
    render(ActiveBooks);
    await waitFor(() => expect(appState.getDailyGoal("a")).toEqual({ start: 100, end: 150 }));
  });

  // A goal from a previous day must not carry over into today.
  it("ignores goals saved for other dates", async () => {
    backend.goals = [{ book_id: "a", date: "2000-01-01", start: 1, end: 2 }];
    await appState.loadData();
    expect(appState.getDailyGoal("a")).toBeUndefined();
  });

  // The default goal created on first view must also survive a restart.
  it("saves a newly created default goal under today's date", async () => {
    await appState.loadData();
    render(ActiveBooks);
    await waitFor(() => expect(backend.setDailyGoal).toHaveBeenCalled());
    const saved = backend.setDailyGoal.mock.calls[0][0];
    expect(saved).toMatchObject({ book_id: "a", date: today, start: 120 });
  });

  it("saves a goal under today's date when it is set", async () => {
    await appState.setDailyGoal("a", { start: 120, end: 160 });
    expect(backend.setDailyGoal).toHaveBeenCalledWith({ book_id: "a", date: today, start: 120, end: 160 });
    expect(appState.getDailyGoal("a")).toEqual({ start: 120, end: 160 });
  });

  // The goal still works for this session if saving fails, but the reader is told.
  it("keeps the goal in view and reports an error when saving fails", async () => {
    backend.failSave = true;
    await appState.setDailyGoal("a", { start: 1, end: 2 });
    expect(appState.getDailyGoal("a")).toEqual({ start: 1, end: 2 });
    expect(appState.error).toBe("disk full");
  });
});
