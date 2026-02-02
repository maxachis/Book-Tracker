<script lang="ts">
  import type { Book, ProgressType, CreateBookRequest, UpdateBookRequest } from "../types";

  interface Props {
    book?: Book;
    onSubmit: (data: CreateBookRequest | UpdateBookRequest) => Promise<void>;
    onCancel: () => void;
  }

  let { book, onSubmit, onCancel }: Props = $props();

  let title = $state(book?.title ?? "");
  let author = $state(book?.author ?? "");
  let totalProgress = $state(book?.total_progress ?? 300);
  let progressType = $state<ProgressType>(book?.progress_type ?? "page");
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
  <h3>{isEditing ? "Edit Book" : "Add New Book"}</h3>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="form-group">
    <label for="title">Title *</label>
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
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    max-width: 500px;
  }

  h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  .error {
    background: #ffebee;
    color: #c62828;
    padding: 0.5rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.3rem;
    font-size: 0.9rem;
    color: #666;
  }

  input,
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #2196f3;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .btn-primary {
    background: #2196f3;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #1976d2;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #e0e0e0;
    color: #333;
  }

  .btn-secondary:hover {
    background: #d0d0d0;
  }
</style>
