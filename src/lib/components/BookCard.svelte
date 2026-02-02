<script lang="ts">
  import type { Book, UserSettings } from "../types";
  import ProgressBar from "./ProgressBar.svelte";
  import ReadingGoals from "./ReadingGoals.svelte";
  import { formatProgress, getProgressPercentage, calculateReadingGoal, getProgressLabel } from "../services/calculations";

  interface Props {
    book: Book;
    settings: UserSettings;
    onEdit: (book: Book) => void;
    onDelete: (book: Book) => void;
    onProgressUpdate: (book: Book, progress: number) => void;
    onMarkComplete?: (book: Book) => void;
  }

  let { book, settings, onEdit, onDelete, onProgressUpdate, onMarkComplete }: Props =
    $props();

  let progressInput = $state(book.current_progress);
  let isUpdating = $state(false);

  // Daily goal state
  let dailyGoalStart = $state(book.current_progress);
  let dailyGoalEnd = $state(book.current_progress);
  let dailyGoalInitialized = $state(false);

  const percentage = $derived(getProgressPercentage(book));
  const progressText = $derived(formatProgress(book));
  const isCompleted = $derived(!!book.completed_at);
  const progressLabel = $derived(getProgressLabel(book.progress_type));

  // Calculate default daily goal end based on reading goal
  function getDefaultDailyGoalEnd(startProgress: number): number {
    const goal = calculateReadingGoal(book, settings);
    if (goal && goal.pagesPerDay > 0) {
      return Math.min(startProgress + Math.ceil(goal.pagesPerDay), book.total_progress);
    }
    // If no target date, default to 10% of remaining or at least 1 unit
    const remaining = book.total_progress - startProgress;
    const defaultIncrement = Math.max(1, Math.ceil(remaining * 0.1));
    return Math.min(startProgress + defaultIncrement, book.total_progress);
  }

  // Initialize daily goal on first render for active books
  $effect(() => {
    if (!isCompleted && !dailyGoalInitialized) {
      dailyGoalStart = book.current_progress;
      dailyGoalEnd = getDefaultDailyGoalEnd(book.current_progress);
      dailyGoalInitialized = true;
    }
  });

  // Daily goal progress percentage
  const dailyGoalPercentage = $derived.by(() => {
    const range = dailyGoalEnd - dailyGoalStart;
    if (range <= 0) return 100;
    const progress = book.current_progress - dailyGoalStart;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  });

  const dailyGoalProgressText = $derived(
    `${book.current_progress - dailyGoalStart} / ${dailyGoalEnd - dailyGoalStart} ${progressLabel}`
  );

  function resetDailyGoal() {
    dailyGoalStart = book.current_progress;
    dailyGoalEnd = getDefaultDailyGoalEnd(book.current_progress);
  }

  async function handleProgressChange() {
    const newProgress = Number(progressInput);
    if (Number.isNaN(newProgress)) {
      progressInput = book.current_progress;
      return;
    }
    if (newProgress !== book.current_progress) {
      isUpdating = true;
      try {
        await onProgressUpdate(book, newProgress);
      } catch (e) {
        console.error("Failed to update progress:", e);
        // Revert to the book's current progress on error
        progressInput = book.current_progress;
      } finally {
        isUpdating = false;
      }
    }
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      onDelete(book);
    }
  }
</script>

<div class="book-card" class:completed={isCompleted}>
  <div class="book-header">
    <h3 class="book-title">{book.title}</h3>
    {#if book.author}
      <p class="book-author">by {book.author}</p>
    {/if}
  </div>

  {#if !isCompleted}
    <div class="progress-panels">
      <div class="progress-panel">
        <h4 class="panel-title">Overall Progress</h4>
        <div class="book-progress">
          <ProgressBar {percentage} />
          <p class="progress-text">{progressText}</p>
        </div>
        <div class="progress-input-group">
          <label for="progress-{book.id}">Update:</label>
          <input
            id="progress-{book.id}"
            type="number"
            bind:value={progressInput}
            min="0"
            max={book.total_progress}
            disabled={isUpdating}
            onchange={handleProgressChange}
          />
          <span class="progress-max">/ {book.total_progress}</span>
        </div>
      </div>

      <div class="progress-panel daily-goal-panel">
        <h4 class="panel-title">Daily Goal</h4>
        <div class="book-progress">
          <ProgressBar percentage={dailyGoalPercentage} />
          <p class="progress-text">{dailyGoalProgressText}</p>
        </div>
        <div class="daily-goal-inputs">
          <div class="daily-goal-input-group">
            <label for="daily-start-{book.id}">Start:</label>
            <input
              id="daily-start-{book.id}"
              type="number"
              bind:value={dailyGoalStart}
              min="0"
              max={book.total_progress}
            />
          </div>
          <div class="daily-goal-input-group">
            <label for="daily-end-{book.id}">End:</label>
            <input
              id="daily-end-{book.id}"
              type="number"
              bind:value={dailyGoalEnd}
              min="0"
              max={book.total_progress}
            />
          </div>
        </div>
        <button class="btn-reset" onclick={resetDailyGoal}>Reset Daily Goal</button>
      </div>
    </div>

    <ReadingGoals {book} {settings} />
  {:else}
    <div class="book-progress">
      <ProgressBar {percentage} />
      <p class="progress-text">{progressText}</p>
    </div>
  {/if}

  {#if book.target_date}
    <p class="target-date">
      Target: {new Date(book.target_date).toLocaleDateString()}
    </p>
  {/if}

  {#if book.completed_at}
    <p class="completed-date">
      Completed: {new Date(book.completed_at).toLocaleDateString()}
    </p>
  {/if}

  <div class="book-actions">
    <button class="btn-edit" onclick={() => onEdit(book)}>Edit</button>
    {#if !isCompleted && onMarkComplete}
      <button class="btn-complete" onclick={() => onMarkComplete(book)}>
        Mark Complete
      </button>
    {/if}
    <button class="btn-delete" onclick={handleDelete}>Delete</button>
  </div>
</div>

<style>
  .book-card {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .book-card.completed {
    opacity: 0.8;
    background: #f9f9f9;
  }

  .book-header {
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }

  .book-title {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
  }

  .book-author {
    margin: 0.25rem 0 0 0;
    font-size: 0.9rem;
    color: #666;
  }

  .progress-panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .progress-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .daily-goal-panel {
    background: #fff8e1;
  }

  .panel-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .book-progress {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .progress-text {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }

  .progress-input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .progress-input-group label {
    color: #666;
  }

  .progress-input-group input {
    width: 70px;
    padding: 0.3rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .progress-max {
    color: #999;
  }

  .daily-goal-inputs {
    display: flex;
    gap: 0.75rem;
  }

  .daily-goal-input-group {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.85rem;
  }

  .daily-goal-input-group label {
    color: #666;
  }

  .daily-goal-input-group input {
    width: 66px;
    padding: 0.25rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .btn-reset {
    padding: 0.3rem 0.6rem;
    background: #fff3e0;
    border: 1px solid #ffb74d;
    border-radius: 4px;
    color: #e65100;
    font-size: 0.75rem;
    cursor: pointer;
    align-self: flex-start;
  }

  .btn-reset:hover {
    background: #ffe0b2;
  }

  .target-date,
  .completed-date {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }

  .completed-date {
    color: #4caf50;
  }

  .book-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #eee;
  }

  .book-actions button {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .btn-edit {
    background: #e3f2fd;
    color: #1976d2;
  }

  .btn-edit:hover {
    background: #bbdefb;
  }

  .btn-complete {
    background: #e8f5e9;
    color: #388e3c;
  }

  .btn-complete:hover {
    background: #c8e6c9;
  }

  .btn-delete {
    background: #ffebee;
    color: #c62828;
  }

  .btn-delete:hover {
    background: #ffcdd2;
  }
</style>
