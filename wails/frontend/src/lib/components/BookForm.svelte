<script lang="ts">
  import type { Book, ProgressType, CreateBookRequest, UpdateBookRequest } from "../types";

  interface Props {
    book?: Book;
    onSubmit: (data: CreateBookRequest | UpdateBookRequest) => Promise<void>;
    onCancel: () => void;
  }

  let { book, onSubmit, onCancel }: Props = $props();

  // svelte-ignore state_referenced_locally
  let title = $state(book?.title ?? "");
  // svelte-ignore state_referenced_locally
  let author = $state(book?.author ?? "");
  // svelte-ignore state_referenced_locally
  let totalProgress = $state(book?.total_progress ?? 300);
  // svelte-ignore state_referenced_locally
  let progressType = $state<ProgressType>(book?.progress_type ?? "page");
  // svelte-ignore state_referenced_locally
  let targetDate = $state(book?.target_date ?? "");
  let isSubmitting = $state(false);
  let error = $state<string | null>(null);

  const isEditing = $derived(!!book);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = null;
    isSubmitting = true;

    try {
      if (isEditing && book) {
        await onSubmit({
          id: book.id,
          title,
          author: author || null,
          total_progress: totalProgress,
          progress_type: progressType,
          target_date: targetDate || null,
        });
      } else {
        await onSubmit({
          title,
          author: author || null,
          total_progress: totalProgress,
          progress_type: progressType,
          target_date: targetDate || null,
        });
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to save book";
    } finally {
      isSubmitting = false;
    }
  }

  const progressLabel = $derived(
    progressType === "page" ? "End Page" :
    progressType === "location" ? "End Location" :
    "End Percentage"
  );
</script>

<form class="book-form" onsubmit={handleSubmit}>
  <div class="form-header">
    <h3>{isEditing ? "Edit Book" : "Add New Book"}</h3>
    <span class="form-ornament">&#9671;</span>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="form-group">
    <label for="title">Title</label>
    <input
      id="title"
      type="text"
      bind:value={title}
      required
      placeholder="Enter book title"
    />
  </div>

  <div class="form-group">
    <label for="author">Author</label>
    <input
      id="author"
      type="text"
      bind:value={author}
      placeholder="Enter author name"
    />
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="progressType">Progress Type</label>
      <select id="progressType" bind:value={progressType}>
        <option value="page">Pages</option>
        <option value="location">Locations (Kindle)</option>
        <option value="percentage">Percentage</option>
      </select>
    </div>

    <div class="form-group">
      <label for="totalProgress">{progressLabel}</label>
      <input
        id="totalProgress"
        type="number"
        bind:value={totalProgress}
        min="1"
        required
      />
    </div>
  </div>

  <div class="form-group">
    <label for="targetDate">Target Completion Date</label>
    <input id="targetDate" type="date" bind:value={targetDate} />
  </div>

  <div class="form-actions">
    <button type="button" class="btn-secondary" onclick={onCancel}>
      Cancel
    </button>
    <button type="submit" class="btn-primary" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add Book"}
    </button>
  </div>
</form>

<style>
  .book-form {
    background: var(--bg-card);
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-medium);
    box-shadow: var(--shadow-md);
    max-width: 520px;
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-subtle);
  }

  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--gold-100);
  }

  .form-ornament {
    color: var(--gold-500);
    opacity: 0.4;
    font-size: 0.9rem;
  }

  .error {
    background: rgba(196, 114, 114, 0.1);
    color: var(--accent-red);
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(196, 114, 114, 0.2);
    margin-bottom: 1rem;
    font-size: 0.85rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-row {
    display: flex;
    gap: 1rem;
  }

  .form-row .form-group {
    flex: 1;
  }

  label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  input,
  select {
    width: 100%;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-input);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.9rem;
    box-sizing: border-box;
    transition: border-color var(--transition-fast);
  }

  input::placeholder {
    color: var(--text-muted);
    opacity: 0.5;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--gold-500);
  }

  select {
    cursor: pointer;
  }

  select option {
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-subtle);
  }

  button {
    padding: 0.5rem 1.1rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    transition: all var(--transition-fast);
  }

  .btn-primary {
    background: var(--gold-500);
    color: var(--bg-deep);
    border-color: var(--gold-500);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--gold-400);
    border-color: var(--gold-400);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: transparent;
    border-color: var(--border-medium);
    color: var(--text-secondary);
  }

  .btn-secondary:hover {
    border-color: var(--text-muted);
    color: var(--text-primary);
  }
</style>
