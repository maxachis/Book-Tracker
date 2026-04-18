<script lang="ts">
  import type { Book, DailyGoal, UserSettings, ReadingGoal } from "../types";
  import { calculateReadingGoal, getProgressLabel } from "../services/calculations";

  interface Props {
    book: Book;
    settings: UserSettings;
    dailyGoal?: DailyGoal;
  }

  let { book, settings, dailyGoal }: Props = $props();

  const goal: ReadingGoal | null = $derived(calculateReadingGoal(book, settings, dailyGoal));
  const progressLabel = $derived(getProgressLabel(book.progress_type));
</script>

{#if goal}
  <div class="reading-goals" class:overdue={goal.isOverdue}>
    {#if goal.isOverdue}
      <div class="overdue-content">
        <span class="overdue-badge">Overdue</span>
        <span class="goal-text">
          {book.total_progress - book.current_progress} {progressLabel} remaining
        </span>
      </div>
    {:else}
      <div class="goal-item">
        <span class="goal-value">{goal.pagesPerDay}</span>
        <span class="goal-label">{progressLabel}/day</span>
      </div>
      <div class="goal-divider"></div>
      <div class="goal-item">
        <span class="goal-value">{goal.pagesPerHour}</span>
        <span class="goal-label">{progressLabel}/hour</span>
      </div>
      {#if goal.pagesPerHourToday !== null}
        <div class="goal-divider"></div>
        <div class="goal-item today-rate">
          <span class="goal-value">{goal.pagesPerHourToday}</span>
          <span class="goal-label">{progressLabel}/hr today</span>
        </div>
      {/if}
      <div class="goal-divider"></div>
      <div class="goal-item">
        <span class="goal-value">{goal.daysRemaining}</span>
        <span class="goal-label">days left</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .reading-goals {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0.6rem 0.75rem;
    background: rgba(212, 185, 120, 0.04);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
  }

  .reading-goals.overdue {
    background: rgba(196, 114, 114, 0.08);
    border-color: rgba(196, 114, 114, 0.15);
  }

  .overdue-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .overdue-badge {
    background: var(--accent-red);
    color: var(--bg-deep);
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .goal-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 0.75rem;
    min-width: 0;
  }

  .goal-divider {
    width: 1px;
    height: 28px;
    background: var(--border-medium);
    flex-shrink: 0;
  }

  .goal-value {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.05rem;
    color: var(--gold-300);
    line-height: 1.2;
  }

  .reading-goals.overdue .goal-value {
    color: var(--accent-red);
  }

  .goal-label {
    color: var(--text-muted);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .goal-item.today-rate .goal-value {
    color: var(--accent-purple);
  }

  .goal-item.today-rate .goal-label {
    color: var(--accent-purple);
    opacity: 0.7;
  }

  .goal-text {
    color: var(--accent-red);
    font-size: 0.85rem;
  }
</style>
