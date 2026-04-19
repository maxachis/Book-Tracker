<script lang="ts">
  import type { Book, UserSettings } from "../types";
  import ProgressBar from "./ProgressBar.svelte";
  import ReadingGoals from "./ReadingGoals.svelte";
  import { formatProgress, getProgressPercentage, calculateReadingGoal, getProgressLabel } from "../services/calculations";
  import { appState } from "../stores/state.svelte";
  import { formatLocalDate } from "../services/dates";

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

  // svelte-ignore state_referenced_locally
  let progressInput = $state(book.current_progress);
  let isUpdating = $state(false);

  const percentage = $derived(getProgressPercentage(book));
  const progressText = $derived(formatProgress(book));
  const isCompleted = $derived(!!book.completed_at);
  const progressLabel = $derived(getProgressLabel(book.progress_type));
  const quickAddLabel = $derived.by(() => {
    if (book.progress_type === "percentage") return "+1%";
    if (book.progress_type === "location") return "+1 location";
    return "+1 page";
  });

  function getDefaultDailyGoalEnd(startProgress: number): number {
    const goal = calculateReadingGoal(book, settings);
    if (goal && goal.pagesPerDay > 0) {
      return Math.min(startProgress + Math.ceil(goal.pagesPerDay), book.total_progress);
    }
    const remaining = book.total_progress - startProgress;
    const defaultIncrement = Math.max(1, Math.ceil(remaining * 0.1));
    return Math.min(startProgress + defaultIncrement, book.total_progress);
  }

  // svelte-ignore state_referenced_locally
  let lastTargetDate = $state(book.target_date);

  $effect(() => {
    const targetChanged = book.target_date !== lastTargetDate;
    if (targetChanged) {
      lastTargetDate = book.target_date;
    }
    if (!isCompleted && (!appState.getDailyGoal(book.id) || targetChanged)) {
      appState.setDailyGoal(book.id, {
        start: book.current_progress,
        end: getDefaultDailyGoalEnd(book.current_progress)
      });
    }
  });

  const dailyGoal = $derived(
    appState.getDailyGoal(book.id) ?? { start: book.current_progress, end: book.current_progress }
  );

  const dailyGoalPercentage = $derived.by(() => {
    const range = dailyGoal.end - dailyGoal.start;
    if (range <= 0) return 100;
    const progress = book.current_progress - dailyGoal.start;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  });

  const dailyGoalProgressText = $derived(
    `${book.current_progress - dailyGoal.start} / ${dailyGoal.end - dailyGoal.start} ${progressLabel}`
  );

  function updateDailyGoalStart(newStart: number) {
    appState.setDailyGoal(book.id, { start: newStart, end: dailyGoal.end });
  }

  function updateDailyGoalEnd(newEnd: number) {
    appState.setDailyGoal(book.id, { start: dailyGoal.start, end: newEnd });
  }

  function resetDailyGoal() {
    appState.setDailyGoal(book.id, {
      start: book.current_progress,
      end: getDefaultDailyGoalEnd(book.current_progress)
    });
  }

  async function submitProgressUpdate(newProgress: number) {
    if (newProgress !== book.current_progress) {
      isUpdating = true;
      try {
        await onProgressUpdate(book, newProgress);
      } catch (e) {
        console.error("Failed to update progress:", e);
        progressInput = book.current_progress;
      } finally {
        isUpdating = false;
      }
    }
  }

  async function handleProgressChange() {
    const newProgress = Number(progressInput);
    if (Number.isNaN(newProgress)) {
      progressInput = book.current_progress;
      return;
    }
    await submitProgressUpdate(newProgress);
  }

  async function handleQuickAdd() {
    if (isUpdating || book.current_progress >= book.total_progress) {
      return;
    }
    const nextProgress = Math.min(book.current_progress + 1, book.total_progress);
    progressInput = nextProgress;
    await submitProgressUpdate(nextProgress);
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      onDelete(book);
    }
  }
</script>

<article class="book-card" class:completed={isCompleted}>
  <div class="book-header">
    <div class="title-block">
      <h3 class="book-title">{book.title}</h3>
      {#if book.author}
        <p class="book-author">{book.author}</p>
      {/if}
    </div>
    {#if !isCompleted}
      <span class="percentage-badge">{Math.round(percentage)}%</span>
    {/if}
  </div>

  {#if !isCompleted}
    <div class="progress-panels">
      <div class="progress-panel panel-overall">
        <h4 class="panel-title">Overall Progress</h4>
        <div class="book-progress">
          <ProgressBar {percentage} showLabel={false} />
          <p class="progress-text">{progressText}</p>
        </div>
        <div class="progress-input-group">
          <label for="progress-{book.id}">Update</label>
          <div class="input-with-suffix">
            <input
              id="progress-{book.id}"
              type="number"
              bind:value={progressInput}
              min="0"
              max={book.total_progress}
              disabled={isUpdating}
              onchange={handleProgressChange}
            />
            <span class="input-suffix">/ {book.total_progress}</span>
          </div>
        </div>
        <div class="quick-add-row">
          <button
            class="btn-reset btn-quick-add"
            onclick={handleQuickAdd}
            disabled={isUpdating || book.current_progress >= book.total_progress}
          >
            {quickAddLabel}
          </button>
        </div>
      </div>

      <div class="progress-panel panel-daily">
        <h4 class="panel-title">Daily Goal</h4>
        <div class="book-progress">
          <ProgressBar percentage={dailyGoalPercentage} showLabel={false} />
          <p class="progress-text">{dailyGoalProgressText}</p>
        </div>
        <div class="daily-goal-inputs">
          <div class="daily-goal-input-group">
            <label for="daily-start-{book.id}">Start</label>
            <input
              id="daily-start-{book.id}"
              type="number"
              value={dailyGoal.start}
              onchange={(e) => updateDailyGoalStart(Number(e.currentTarget.value))}
              min="0"
              max={book.total_progress}
            />
          </div>
          <div class="daily-goal-input-group">
            <label for="daily-end-{book.id}">End</label>
            <input
              id="daily-end-{book.id}"
              type="number"
              value={dailyGoal.end}
              onchange={(e) => updateDailyGoalEnd(Number(e.currentTarget.value))}
              min="0"
              max={book.total_progress}
            />
          </div>
        </div>
        <button class="btn-reset" onclick={resetDailyGoal}>Reset Goal</button>
      </div>
    </div>

    <ReadingGoals {book} {settings} {dailyGoal} />
  {:else}
    <div class="book-progress">
      <ProgressBar {percentage} />
      <p class="progress-text">{progressText}</p>
    </div>
  {/if}

  <div class="book-meta">
    {#if book.target_date}
      <span class="meta-item">
        <span class="meta-icon">&#9670;</span>
        Target: {formatLocalDate(book.target_date)}
      </span>
    {/if}
    {#if book.completed_at}
      <span class="meta-item completed-meta">
        <span class="meta-icon">&#10003;</span>
        Completed: {formatLocalDate(book.completed_at)}
      </span>
    {/if}
  </div>

  <div class="book-actions">
    <button class="btn btn-edit" onclick={() => onEdit(book)}>Edit</button>
    {#if !isCompleted && onMarkComplete}
      <button class="btn btn-complete" onclick={() => onMarkComplete(book)}>
        Mark Complete
      </button>
    {/if}
    <button class="btn btn-delete" onclick={handleDelete}>Delete</button>
  </div>
</article>

<style>
  .book-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    transition: border-color var(--transition-base), box-shadow var(--transition-base);
  }

  .book-card:hover {
    border-color: var(--border-medium);
    box-shadow: var(--shadow-glow);
  }

  .book-card.completed {
    opacity: 0.7;
  }

  .book-card.completed:hover {
    opacity: 0.85;
  }

  .book-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-subtle);
  }

  .title-block {
    min-width: 0;
    flex: 1;
  }

  .book-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--gold-100);
    line-height: 1.3;
  }

  .book-author {
    margin: 0.2rem 0 0 0;
    font-size: 0.82rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .percentage-badge {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--gold-400);
    white-space: nowrap;
    padding: 0.1rem 0;
    font-variant-numeric: tabular-nums;
  }

  .progress-panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .progress-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-subtle);
  }

  .panel-overall {
    background: rgba(212, 185, 120, 0.03);
  }

  .panel-daily {
    background: rgba(212, 164, 74, 0.05);
    border-color: rgba(212, 164, 74, 0.1);
  }

  .panel-title {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .book-progress {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .progress-text {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .progress-input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
  }

  .progress-input-group label {
    color: var(--text-muted);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .input-with-suffix {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex: 1;
  }

  .progress-input-group input {
    width: 65px;
    padding: 0.3rem 0.4rem;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-input);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
    transition: border-color var(--transition-fast);
  }

  .progress-input-group input:focus {
    outline: none;
    border-color: var(--gold-500);
  }

  .input-suffix {
    color: var(--text-muted);
    font-size: 0.78rem;
    white-space: nowrap;
  }

  .quick-add-row {
    display: flex;
    justify-content: flex-end;
  }

  .btn-quick-add {
    align-self: flex-end;
  }

  .daily-goal-inputs {
    display: flex;
    gap: 0.6rem;
  }

  .daily-goal-input-group {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.82rem;
  }

  .daily-goal-input-group label {
    color: var(--text-muted);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .daily-goal-input-group input {
    width: 58px;
    padding: 0.25rem 0.35rem;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-input);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    transition: border-color var(--transition-fast);
  }

  .daily-goal-input-group input:focus {
    outline: none;
    border-color: var(--gold-500);
  }

  .btn-reset {
    padding: 0.25rem 0.55rem;
    background: transparent;
    border: 1px solid rgba(212, 164, 74, 0.2);
    border-radius: var(--radius-sm);
    color: var(--accent-amber);
    font-family: var(--font-body);
    font-size: 0.68rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    align-self: flex-start;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .btn-reset:hover {
    background: rgba(212, 164, 74, 0.08);
    border-color: rgba(212, 164, 74, 0.35);
  }

  .book-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .meta-item {
    font-size: 0.78rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .meta-icon {
    font-size: 0.55rem;
    opacity: 0.6;
  }

  .completed-meta {
    color: var(--accent-green);
  }

  .completed-meta .meta-icon {
    opacity: 0.8;
  }

  .book-actions {
    display: flex;
    gap: 0.4rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--border-subtle);
  }

  .btn {
    padding: 0.35rem 0.75rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .btn-edit {
    background: transparent;
    border-color: var(--border-medium);
    color: var(--text-secondary);
  }

  .btn-edit:hover {
    border-color: var(--gold-500);
    color: var(--gold-300);
    background: rgba(212, 185, 120, 0.05);
  }

  .btn-complete {
    background: transparent;
    border-color: rgba(122, 182, 122, 0.2);
    color: var(--accent-green);
  }

  .btn-complete:hover {
    background: rgba(122, 182, 122, 0.08);
    border-color: rgba(122, 182, 122, 0.4);
  }

  .btn-delete {
    background: transparent;
    border-color: rgba(196, 114, 114, 0.15);
    color: var(--text-muted);
    margin-left: auto;
  }

  .btn-delete:hover {
    background: rgba(196, 114, 114, 0.08);
    border-color: rgba(196, 114, 114, 0.3);
    color: var(--accent-red);
  }
</style>
