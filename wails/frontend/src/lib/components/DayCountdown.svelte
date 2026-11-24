<script lang="ts">
  import type { Book, DailyGoal } from "../types";
  import {
    formatCountdown,
    secondsUntilEndOfDay,
    secondsPerUnitDue,
    dueUnitLabel,
    paceUnitLabel,
    amountUnitLabel,
  } from "../services/countdown";
  import { dueClock } from "../stores/dueClock.svelte";

  interface Props {
    book: Book;
    dailyGoal: DailyGoal;
    /** Hour (0–24, local) the reading day ends; set in Settings. */
    endHour: number;
  }

  let { book, dailyGoal, endHour }: Props = $props();

  const remaining = $derived(dailyGoal.end - book.current_progress);

  $effect(() => dueClock.subscribe());

  const now = $derived(dueClock.now);
  /** When the next unit is due; shared with the sidebar so both agree. */
  const deadline = $derived(
    dueClock.deadlineFor({
      bookId: book.id,
      current: book.current_progress,
      goal: dailyGoal,
      endHour,
      progressType: book.progress_type,
    })
  );

  const secondsLeft = $derived(secondsUntilEndOfDay({ now, endHour }));
  const nextDueSeconds = $derived(
    deadline ? (deadline.getTime() - now.getTime()) / 1000 : null
  );
  /** Live pace: time left spread over what's left, recomputed every tick. */
  const paceSeconds = $derived(
    secondsPerUnitDue({ secondsLeft, remaining, progressType: book.progress_type })
  );
  const unitLabel = $derived(dueUnitLabel(book.progress_type));
  const endHourLabel = $derived(
    new Date(2000, 0, 1, endHour).toLocaleTimeString([], { hour: "numeric" })
  );
</script>

<div class="day-countdown">
  <div class="countdown-item" data-metric="day-left">
    <span class="countdown-value">{formatCountdown(secondsLeft)}</span>
    <span class="countdown-label">left until {endHourLabel}</span>
  </div>
  <div class="countdown-divider"></div>
  <div class="countdown-item" data-metric="next-due" class:met={nextDueSeconds === null}>
    <span class="countdown-value">
      {nextDueSeconds === null ? "Goal met" : formatCountdown(nextDueSeconds)}
    </span>
    <span class="countdown-label">next {unitLabel} due</span>
  </div>
  <div class="countdown-divider"></div>
  <div class="countdown-item" data-metric="pace">
    <span class="countdown-value">
      {#if paceSeconds === null}
        &mdash;
      {:else}
        <span class="pace-unit">{paceUnitLabel(book.progress_type)} every</span> {formatCountdown(paceSeconds)}
      {/if}
    </span>
    <span class="countdown-label">current pace</span>
  </div>
  <div class="countdown-divider"></div>
  <div class="countdown-item" data-metric="remaining">
    <span class="countdown-value">{Math.max(0, remaining)}</span>
    <span class="countdown-label">{amountUnitLabel(book.progress_type)} left today</span>
  </div>
</div>

<style>
  .day-countdown {
    display: flex;
    align-items: center;
    padding: 0.6rem 0.75rem;
    background: rgba(212, 185, 120, 0.04);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
  }

  .countdown-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 0.75rem;
    min-width: 0;
  }

  .countdown-divider {
    width: 1px;
    height: 28px;
    background: var(--border-medium);
    flex-shrink: 0;
  }

  .countdown-value {
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 1.05rem;
    font-variant-numeric: tabular-nums;
    color: var(--gold-300);
    line-height: 1.2;
  }

  .countdown-item.met .countdown-value {
    color: var(--accent-green);
  }

  .pace-unit {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--text-secondary);
  }

  .countdown-label {
    color: var(--text-muted);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
</style>
