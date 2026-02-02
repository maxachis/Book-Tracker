<script lang="ts">
  import type { Book, UserSettings, ReadingGoal } from "../types";
  import { calculateReadingGoal, getProgressLabel } from "../services/calculations";

  interface Props {
    book: Book;
    settings: UserSettings;
  }

  let { book, settings }: Props = $props();

  const goal: ReadingGoal | null = $derived(calculateReadingGoal(book, settings));
  const progressLabel = $derived(getProgressLabel(book.progress_type));
</script>

{#if goal}
  <div class="reading-goals" class:overdue={goal.isOverdue}>
    {#if goal.isOverdue}
      <span class="overdue-badge">Overdue</span>
      <span class="goal-text">
        {book.total_progress - book.current_progress} {progressLabel} remaining
      </span>
    {:else}
      <div class="goal-item">
        <span class="goal-value">{goal.pagesPerDay}</span>
        <span class="goal-label">{progressLabel}/day</span>
      </div>
      <div class="goal-item">
        <span class="goal-value">{goal.pagesPerHour}</span>
        <span class="goal-label">{progressLabel}/hour</span>
      </div>
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
    gap: 1rem;
    padding: 0.5rem;
    background: #e3f2fd;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .reading-goals.overdue {
    background: #ffebee;
  }

  .overdue-badge {
    background: #f44336;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    font-weight: bold;
  }

  .goal-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .goal-value {
    font-weight: bold;
    color: #1976d2;
  }

  .reading-goals.overdue .goal-value {
    color: #d32f2f;
  }

  .goal-label {
    color: #666;
    font-size: 0.75rem;
  }

  .goal-text {
    color: #d32f2f;
  }
</style>
