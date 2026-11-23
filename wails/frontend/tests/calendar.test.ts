import { describe, expect, it } from "vitest";
import { addMonths, groupTargetDates, monthGrid, parseISODate, toISODate } from "../src/lib/services/calendar";
import type { Book } from "../src/lib/types";

const NOVEMBER = 10; // month is 0-based

function book(overrides: Partial<Book>): Book {
  return {
    id: "b",
    title: "T",
    author: null,
    current_progress: 0,
    total_progress: 100,
    progress_type: "page",
    target_date: null,
    completed_at: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("toISODate / parseISODate", () => {
  it("formats a local date as zero-padded YYYY-MM-DD", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  // new Date("YYYY-MM-DD") parses as UTC and shifts the day in western timezones.
  it("parses an ISO date to local midnight of that same day", () => {
    const d = parseISODate("2026-11-23");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, NOVEMBER, 23, 0]);
  });

  it("round-trips through parse and format", () => {
    expect(toISODate(parseISODate("2028-02-29"))).toBe("2028-02-29");
  });
});

describe("monthGrid", () => {
  const grid = monthGrid({ year: 2026, month: NOVEMBER });

  it("always has six weeks of seven days", () => {
    expect(grid).toHaveLength(42);
    expect(monthGrid({ year: 2026, month: 1 })).toHaveLength(42); // Feb 2026 fits in 4 weeks
  });

  it("starts on the Sunday on or before the 1st", () => {
    // 1 Nov 2026 is a Sunday.
    expect(grid[0].iso).toBe("2026-11-01");
    // 1 Dec 2026 is a Tuesday, so the grid starts Sunday 29 Nov.
    expect(monthGrid({ year: 2026, month: 11 })[0].iso).toBe("2026-11-29");
  });

  it("flags days outside the requested month", () => {
    const dec = monthGrid({ year: 2026, month: 11 });
    expect(dec[0]).toMatchObject({ day: 29, inMonth: false });
    expect(dec[2]).toMatchObject({ iso: "2026-12-01", day: 1, inMonth: true });
    expect(dec.filter((c) => c.inMonth)).toHaveLength(31);
    expect(dec[41].inMonth).toBe(false);
  });

  it("crosses year boundaries in leading and trailing days", () => {
    const jan = monthGrid({ year: 2027, month: 0 });
    expect(jan[0].iso).toBe("2026-12-27");
  });
});

describe("addMonths", () => {
  it("moves forward and back within a year", () => {
    expect(addMonths({ year: 2026, month: 4 }, 1)).toEqual({ year: 2026, month: 5 });
    expect(addMonths({ year: 2026, month: 4 }, -1)).toEqual({ year: 2026, month: 3 });
  });

  it("rolls the year over in both directions", () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });

  it("handles multi-month deltas", () => {
    expect(addMonths({ year: 2026, month: 10 }, 14)).toEqual({ year: 2028, month: 0 });
  });
});

describe("groupTargetDates", () => {
  it("groups titles of books sharing a target date", () => {
    const map = groupTargetDates(
      [
        book({ id: "1", title: "Dune", target_date: "2026-12-01" }),
        book({ id: "2", title: "Emma", target_date: "2026-12-01" }),
        book({ id: "3", title: "Ulysses", target_date: "2026-12-05" }),
      ],
      { excludeId: "x" },
    );
    expect(map.get("2026-12-01")).toEqual(["Dune", "Emma"]);
    expect(map.get("2026-12-05")).toEqual(["Ulysses"]);
  });

  // The book being edited must not flag its own current target as "taken".
  it("skips the excluded book", () => {
    const map = groupTargetDates(
      [book({ id: "1", title: "Dune", target_date: "2026-12-01" })],
      { excludeId: "1" },
    );
    expect(map.size).toBe(0);
  });

  it("skips books without a target date", () => {
    const map = groupTargetDates([book({ id: "1", target_date: null })], { excludeId: "x" });
    expect(map.size).toBe(0);
  });
});
