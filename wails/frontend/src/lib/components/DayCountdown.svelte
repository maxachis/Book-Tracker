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
  import { tomorrowGoalDrop } from "../services/calculations";
  import ProgressBar from "./ProgressBar.svelte";

  interface Props {
    book: Book;
    dailyGoal: DailyGoal;
    /** Hour (0–24, local) the reading day ends; set in Settings. */
    endHour: number;
    /** Locations per "due" step; set in Settings. */
    locationStep: number;
  }

  let { book, dailyGoal, endHour, locationStep }: Props = $props();

  const unit = $derived({ progressType: book.progress_type, locationStep });

  const remaining = $derived(dailyGoal.end - book.current_progress);
  const goalMet = $derived(remaining <= 0);

  $effect(() => dueClock.subscribe());

  const now = $derived(dueClock.now);
  /** When the next unit is due; shared with the sidebar so both agree. */
  const deadline = $derived(
    dueClock.deadlineFor({
      bookId: book.id,
      current: book.current_progress,
      goal: dailyGoal,
      endHour,
      ...unit,
    })
  );

  const secondsLeft = $derived(secondsUntilEndOfDay({ now, endHour }));
  const nextDueSeconds = $derived(
    deadline ? (deadline.getTime() - now.getTime()) / 1000 : null
  );
  /** Live pace: time left spread over what's left, recomputed every tick. */
  const paceSeconds = $derived(
    secondsPerUnitDue({ secondsLeft, remaining, ...unit })
  );
  const unitLabel = $derived(dueUnitLabel(unit));
  /** Once today's goal is met: how much more would lower tomorrow's goal by one. */
  const drop = $derived(goalMet ? tomorrowGoalDrop({ book, today: now }) : null);
  const endHourLabel = $derived(
    new Date(2000, 0, 1, endHour).toLocaleTimeString([], { hour: "numeric" })
  );
</script>

<div class="day-countdown">
  {#if goalMet}
  <div class="countdown-item met" data-metric="goal-met">
    <span class="countdown-value"><span aria-hidden="true">&#10003;</span> Goal met</span>
  </div>
  {#if drop}
    <div class="countdown-divider drop-divider"></div>
    <div class="drop-bar" data-metric="tomorrow-drop-bar">
      <ProgressBar percentage={drop.percentage} showLabel={false} />
    </div>
    <div class="countdown-item drop-count" data-metric="tomorrow-drop">
      <span class="countdown-value">{drop.needed}</span>
      <span class="countdown-label">
        {amountUnitLabel(book.progress_type)} until tomorrow's goal drops to {drop.droppedTo}
      </span>
    </div>
  {/if}
  {:else}
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
        <span class="pace-unit">{paceUnitLabel(unit)} every</span> {formatCountdown(paceSeconds)}
      {/if}
    </span>
    <span class="countdown-label">current pace</span>
  </div>
  <div class="countdown-divider"></div>
  <div class="countdown-item" data-metric="remaining">
    <span class="countdown-value">{Math.max(0, remaining)}</span>
    <span class="countdown-label">{amountUnitLabel(book.progress_type)} left today</span>
  </div>
  {/if}
</div>

<style>
  .day-countdown {
    container-type: inline-size;
    display: flex;
    flex-wrap: wrap;
    row-gap: 0.5rem;
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

  /* Fills the space the countdowns used, between "Goal met" and the count. */
  .drop-bar {
    flex: 1;
    min-width: 3rem;
    padding: 0 0.75rem;
  }

  [data-metric="goal-met"] {
    flex-shrink: 0;
  }

  .countdown-item.met .countdown-value {
    white-space: nowrap;
  }

  /* The long label wraps on a narrow card rather than spilling out of the row. */
  .drop-count {
    flex: 0 1 auto;
  }

  .drop-count .countdown-label {
    white-space: normal;
    text-align: center;
  }

  /* On a narrow card: "Goal met" and the count share a line, the bar runs full width below. */
  @container (max-width: 420px) {
    .drop-divider {
      display: none;
    }
    .drop-count {
      flex: 1;
    }
    .drop-bar {
      order: 1;
      flex-basis: 100%;
    }
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
