import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import DatePicker from "../src/lib/components/DatePicker.svelte";

const TODAY = "2026-11-23";

interface RenderOptions {
  value?: string | null;
  markedDates?: Map<string, string[]>;
  today?: string;
}

function renderPicker({ value = null, markedDates, today = TODAY }: RenderOptions = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const result = render(DatePicker, { props: { value, onSelect, onClose, markedDates, today } });
  const day = (iso: string) => result.container.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
  const title = () => result.container.querySelector(".month-title")!.textContent;
  const days = () => [...result.container.querySelectorAll<HTMLButtonElement>("button[data-date]")];
  return { ...result, onSelect, onClose, day, days, title };
}

function monthName(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

describe("DatePicker month shown", () => {
  it("opens on the month of the chosen date", () => {
    const { title } = renderPicker({ value: "2027-03-15" });
    expect(title()).toBe(monthName("2027-03-15"));
  });

  it("opens on today's month when nothing is chosen", () => {
    const { title } = renderPicker({ value: null });
    expect(title()).toBe(monthName(TODAY));
  });

  it("shows Su Mo Tu We Th Fr Sa as the weekday header", () => {
    const { container } = renderPicker();
    const names = [...container.querySelectorAll(".weekday")].map((e) => e.textContent);
    expect(names).toEqual(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]);
  });
});

describe("DatePicker grid", () => {
  it("renders six weeks of day buttons starting on a Sunday, flagging days outside the month", () => {
    const { days, day } = renderPicker({ value: "2026-12-10" });
    expect(days()).toHaveLength(42);
    // Dec 2026 starts on a Tuesday, so the grid begins Sunday 29 Nov.
    expect(days()[0].dataset.date).toBe("2026-11-29");
    expect(day("2026-11-29").classList.contains("outside")).toBe(true);
    expect(day("2026-12-01").classList.contains("outside")).toBe(false);
  });

  it("gives each day an aria-label with the full date", () => {
    const { day } = renderPicker({ value: "2026-12-10" });
    const expected = new Date(2026, 11, 10).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    expect(day("2026-12-10").getAttribute("aria-label")).toBe(expected);
  });
});

describe("DatePicker navigation", () => {
  it("moves to the next and previous month with the header buttons", async () => {
    const { getByLabelText, title } = renderPicker({ value: "2026-06-10" });
    await fireEvent.click(getByLabelText("Next month"));
    expect(title()).toBe(monthName("2026-07-01"));
    await fireEvent.click(getByLabelText("Previous month"));
    await fireEvent.click(getByLabelText("Previous month"));
    expect(title()).toBe(monthName("2026-05-01"));
  });

  it("rolls the year over when paging past December and January", async () => {
    const { getByLabelText, title } = renderPicker({ value: "2026-12-10" });
    await fireEvent.click(getByLabelText("Next month"));
    expect(title()).toBe(monthName("2027-01-01"));
    await fireEvent.click(getByLabelText("Previous month"));
    await fireEvent.click(getByLabelText("Previous month"));
    expect(title()).toBe(monthName("2026-11-01"));
  });
});

describe("DatePicker selection", () => {
  it("reports the clicked day's ISO date", async () => {
    const { day, onSelect } = renderPicker({ value: "2026-12-10" });
    await fireEvent.click(day("2026-12-15"));
    expect(onSelect).toHaveBeenCalledWith("2026-12-15");
  });

  it("also selects a day from an adjacent month", async () => {
    const { day, onSelect } = renderPicker({ value: "2026-12-10" });
    await fireEvent.click(day("2026-11-30"));
    expect(onSelect).toHaveBeenCalledWith("2026-11-30");
  });

  it("marks the chosen day as selected and pressed", () => {
    const { day } = renderPicker({ value: "2026-11-10" });
    expect(day("2026-11-10").classList.contains("selected")).toBe(true);
    expect(day("2026-11-10").getAttribute("aria-pressed")).toBe("true");
    expect(day("2026-11-11").classList.contains("selected")).toBe(false);
  });

  it("marks today", () => {
    const { day } = renderPicker({ value: null });
    expect(day(TODAY).classList.contains("today")).toBe(true);
    expect(day("2026-11-24").classList.contains("today")).toBe(false);
  });
});

describe("DatePicker marked dates", () => {
  const markedDates = new Map([["2026-11-25", ["Dune", "Emma"]]]);

  // The author sees which days are already another book's target.
  it("flags days that other books target, with a tooltip and a screen-reader suffix", () => {
    const { day } = renderPicker({ markedDates });
    const el = day("2026-11-25");
    expect(el.classList.contains("marked")).toBe(true);
    expect(el.getAttribute("title")).toBe("Target for: Dune, Emma");
    expect(el.getAttribute("aria-label")).toMatch(/, target for Dune, Emma$/);
  });

  it("leaves unmarked days without marker, tooltip or suffix", () => {
    const { day } = renderPicker({ markedDates });
    const el = day("2026-11-26");
    expect(el.classList.contains("marked")).toBe(false);
    expect(el.hasAttribute("title")).toBe(false);
    expect(el.getAttribute("aria-label")).not.toMatch(/target for/);
  });

  it("keeps the marker when the day is also selected or today", () => {
    const both = new Map([
      [TODAY, ["Dune"]],
      ["2026-11-25", ["Emma"]],
    ]);
    const { day } = renderPicker({ value: "2026-11-25", markedDates: both });
    expect(day("2026-11-25").classList.contains("marked")).toBe(true);
    expect(day("2026-11-25").classList.contains("selected")).toBe(true);
    expect(day(TODAY).classList.contains("marked")).toBe(true);
    expect(day(TODAY).classList.contains("today")).toBe(true);
  });
});

describe("DatePicker keyboard", () => {
  it("exposes exactly one tab stop: the selected day", () => {
    const { days, day } = renderPicker({ value: "2026-11-10" });
    const stops = days().filter((d) => d.tabIndex === 0);
    expect(stops).toEqual([day("2026-11-10")]);
  });

  it("falls back to today, then the 1st, for the tab stop", async () => {
    const todayStop = renderPicker({ value: null });
    expect(todayStop.days().filter((d) => d.tabIndex === 0)).toEqual([todayStop.day(TODAY)]);
    todayStop.unmount();

    // Browse to a month showing neither the value nor today: the 1st gets the tab stop.
    const firstStop = renderPicker({ value: "2027-03-15" });
    await fireEvent.click(firstStop.getByLabelText("Next month"));
    expect(firstStop.days().filter((d) => d.tabIndex === 0)).toEqual([firstStop.day("2027-04-01")]);
  });

  it("moves focus a day or a week with the arrow keys", async () => {
    const { day } = renderPicker({ value: "2026-11-10" });
    await fireEvent.keyDown(day("2026-11-10"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(day("2026-11-11"));
    await fireEvent.keyDown(day("2026-11-11"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(day("2026-11-18"));
    await fireEvent.keyDown(day("2026-11-18"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(day("2026-11-17"));
    await fireEvent.keyDown(day("2026-11-17"), { key: "ArrowUp" });
    expect(document.activeElement).toBe(day("2026-11-10"));
  });

  it("moves the roving tab stop along with focus", async () => {
    const { day, days } = renderPicker({ value: "2026-11-10" });
    await fireEvent.keyDown(day("2026-11-10"), { key: "ArrowRight" });
    expect(days().filter((d) => d.tabIndex === 0)).toEqual([day("2026-11-11")]);
  });

  it("switches to the next month when focus crosses the month end", async () => {
    const { day, title } = renderPicker({ value: "2026-11-30" });
    await fireEvent.keyDown(day("2026-11-30"), { key: "ArrowRight" });
    expect(title()).toBe(monthName("2026-12-01"));
    expect(document.activeElement).toBe(day("2026-12-01"));
  });

  it("pages by month with PageDown and PageUp", async () => {
    const { day, title } = renderPicker({ value: "2026-11-10" });
    await fireEvent.keyDown(day("2026-11-10"), { key: "PageDown" });
    expect(title()).toBe(monthName("2026-12-01"));
    expect(document.activeElement).toBe(day("2026-12-10"));
    await fireEvent.keyDown(day("2026-12-10"), { key: "PageUp" });
    expect(document.activeElement).toBe(day("2026-11-10"));
  });

  it("jumps to the start and end of the week row with Home and End", async () => {
    // 2026-11-11 is a Wednesday; its week is Sun 8 to Sat 14.
    const { day } = renderPicker({ value: "2026-11-11" });
    await fireEvent.keyDown(day("2026-11-11"), { key: "Home" });
    expect(document.activeElement).toBe(day("2026-11-08"));
    await fireEvent.keyDown(day("2026-11-08"), { key: "End" });
    expect(document.activeElement).toBe(day("2026-11-14"));
  });

  it("selects the focused day on Enter and on Space", async () => {
    const { day, onSelect } = renderPicker({ value: "2026-11-10" });
    await fireEvent.keyDown(day("2026-11-10"), { key: "ArrowRight" });
    await fireEvent.keyDown(day("2026-11-11"), { key: "Enter" });
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-11");
    await fireEvent.keyDown(day("2026-11-11"), { key: " " });
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-11");
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("calls onClose on Escape without selecting", async () => {
    const { day, onClose, onSelect } = renderPicker({ value: "2026-11-10" });
    await fireEvent.keyDown(day("2026-11-10"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
