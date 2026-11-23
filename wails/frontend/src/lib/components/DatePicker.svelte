<script lang="ts">
  import { tick } from "svelte";
  import { localDateISO } from "../services/dates";
  import {
    DAYS_PER_WEEK,
    addMonths,
    monthGrid,
    parseISODate,
    toISODate,
    type YearMonth,
  } from "../services/calendar";

  interface Props {
    value: string | null;
    onSelect: (iso: string) => void;
    /** Called when Escape is pressed. */
    onClose?: () => void;
    /** ISO date -> titles of books already targeting that day. */
    markedDates?: Map<string, string[]>;
    /** ISO date treated as today; defaults to the real local date. */
    today?: string;
  }

  let { value, onSelect, onClose, markedDates = new Map(), today = localDateISO() }: Props = $props();

  const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const KEY_STEP_DAYS: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -DAYS_PER_WEEK,
    ArrowDown: DAYS_PER_WEEK,
  };
  const KEY_STEP_MONTHS: Record<string, number> = { PageUp: -1, PageDown: 1 };
  const MONTH_TITLE_FORMAT: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  const FULL_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  };

  function monthOf(iso: string): YearMonth {
    const d = parseISODate(iso);
    return { year: d.getFullYear(), month: d.getMonth() };
  }

  // Only the initial value/today decide the opening month; later changes to
  // `value` must not yank the user away from the month they are browsing.
  // svelte-ignore state_referenced_locally
  let view = $state<YearMonth>(monthOf(value ?? today));
  let focusedIso = $state<string | null>(null);
  let rootEl = $state<HTMLDivElement | null>(null);

  const cells = $derived(monthGrid(view));
  const title = $derived(new Date(view.year, view.month, 1).toLocaleDateString(undefined, MONTH_TITLE_FORMAT));

  /** The one day reachable with Tab: keyboard focus, else selected, else today, else the 1st. */
  const tabStopIso = $derived.by(() => {
    const visible = (iso: string | null) => (iso && cells.some((c) => c.iso === iso && c.inMonth) ? iso : null);
    const firstOfMonth = toISODate(new Date(view.year, view.month, 1));
    return visible(focusedIso) ?? visible(value) ?? visible(today) ?? firstOfMonth;
  });

  function describe(iso: string): string {
    const label = parseISODate(iso).toLocaleDateString(undefined, FULL_DATE_FORMAT);
    const titles = markedDates.get(iso);
    return titles?.length ? `${label}, target for ${titles.join(", ")}` : label;
  }

  function showMonth(delta: number) {
    view = addMonths(view, delta);
  }

  function addDays(iso: string, delta: number): string {
    const d = parseISODate(iso);
    d.setDate(d.getDate() + delta);
    return toISODate(d);
  }

  /** Same day-of-month a month away, clamped to the target month's length. */
  function addMonthsClamped(iso: string, delta: number): string {
    const d = parseISODate(iso);
    const target = addMonths({ year: d.getFullYear(), month: d.getMonth() }, delta);
    const lastDay = new Date(target.year, target.month + 1, 0).getDate();
    return toISODate(new Date(target.year, target.month, Math.min(d.getDate(), lastDay)));
  }

  function destinationFor(key: string, from: string): string | null {
    if (key in KEY_STEP_DAYS) return addDays(from, KEY_STEP_DAYS[key]);
    if (key in KEY_STEP_MONTHS) return addMonthsClamped(from, KEY_STEP_MONTHS[key]);
    const weekday = parseISODate(from).getDay();
    if (key === "Home") return addDays(from, -weekday);
    if (key === "End") return addDays(from, DAYS_PER_WEEK - 1 - weekday);
    return null;
  }

  async function moveFocusTo(iso: string) {
    focusedIso = iso;
    view = monthOf(iso);
    await tick();
    rootEl?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
      return;
    }
    const iso = (e.target as HTMLElement).closest<HTMLElement>("[data-date]")?.dataset.date;
    if (!iso) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(iso);
      return;
    }
    const destination = destinationFor(e.key, iso);
    if (destination) {
      e.preventDefault();
      void moveFocusTo(destination);
    }
  }
</script>

<!-- Key events from the day buttons and header buttons bubble to this one handler. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="picker" bind:this={rootEl} onkeydown={handleKeyDown}>
  <div class="header">
    <button type="button" class="nav" aria-label="Previous month" onclick={() => showMonth(-1)}>
      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <div class="month-title" aria-live="polite">{title}</div>
    <button type="button" class="nav" aria-label="Next month" onclick={() => showMonth(1)}>
      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
  </div>

  <div class="weekdays" aria-hidden="true">
    {#each WEEKDAY_LABELS as label (label)}
      <span class="weekday">{label}</span>
    {/each}
  </div>

  <div class="grid">
    {#each cells as cell (cell.iso)}
      {@const titles = markedDates.get(cell.iso)}
      <button
        type="button"
        class="day"
        class:outside={!cell.inMonth}
        class:today={cell.iso === today}
        class:selected={cell.iso === value}
        class:marked={!!titles?.length}
        data-date={cell.iso}
        aria-label={describe(cell.iso)}
        aria-pressed={cell.iso === value ? "true" : undefined}
        title={titles?.length ? `Target for: ${titles.join(", ")}` : undefined}
        tabindex={cell.iso === tabStopIso ? 0 : -1}
        onclick={() => onSelect(cell.iso)}
      >
        <span class="num">{cell.day}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .picker {
    width: 16rem;
    box-sizing: border-box;
    padding: 0.5rem;
    background: var(--bg-surface);
    border: 1px solid var(--border-gold);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    font-family: var(--font-body);
    user-select: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.35rem;
  }

  .month-title {
    color: var(--gold-200);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .nav {
    display: grid;
    place-items: center;
    width: 1.6rem;
    height: 1.6rem;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .nav svg {
    width: 0.75rem;
    height: 0.75rem;
  }

  .nav:hover,
  .nav:focus-visible {
    outline: none;
    background: rgba(212, 185, 120, 0.1);
    color: var(--gold-100);
  }

  .weekdays,
  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .weekday {
    padding: 0.2rem 0;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .day {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    font-family: inherit;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .day:hover,
  .day:focus-visible {
    outline: none;
    background: rgba(212, 185, 120, 0.1);
    color: var(--gold-100);
  }

  .day:focus-visible {
    border-color: var(--gold-500);
  }

  .day.outside {
    color: var(--text-muted);
    opacity: 0.5;
  }

  .day.today {
    border-color: var(--gold-400);
  }

  .day.selected {
    background: var(--gold-400);
    color: var(--bg-deep);
    font-weight: 700;
    opacity: 1;
  }

  .day.marked::after {
    content: "";
    position: absolute;
    bottom: 0.2rem;
    left: 50%;
    width: 4px;
    height: 4px;
    margin-left: -2px;
    border-radius: 50%;
    background: var(--gold-400);
  }

  /* A gold dot vanishes on a gold fill, so flip it to the dark text colour. */
  .day.selected.marked::after {
    background: var(--bg-deep);
  }
</style>
