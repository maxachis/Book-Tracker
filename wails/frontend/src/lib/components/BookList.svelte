<script lang="ts">
  import type { Book, UserSettings, SortConfig } from "../types";
  import BookCard from "./BookCard.svelte";
  import SortControls from "./SortControls.svelte";

  interface Props {
    books: Book[];
    settings: UserSettings;
    sortConfig: SortConfig;
    onSort: (config: SortConfig) => void;
    onEdit: (book: Book) => void;
    onDelete: (book: Book) => void;
    onProgressUpdate: (book: Book, progress: number) => void;
    onMarkComplete?: (book: Book) => void;
    emptyMessage?: string;
  }

  let {
    books,
    settings,
    sortConfig,
    onSort,
    onEdit,
    onDelete,
    onProgressUpdate,
    onMarkComplete,
    emptyMessage = "No books found",
  }: Props = $props();
</script>

<div class="book-list">
  <SortControls {sortConfig} {onSort} />

  {#if books.length === 0}
    <div class="empty-state">
      <span class="empty-icon">&#9671;</span>
      <p class="empty-message">{emptyMessage}</p>
    </div>
  {:else}
    <div class="books-grid">
      {#each books as book (book.id)}
        <BookCard
          {book}
          {settings}
          {onEdit}
          {onDelete}
          {onProgressUpdate}
          {onMarkComplete}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .book-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
    gap: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    border: 1px dashed var(--border-medium);
    border-radius: var(--radius-lg);
  }

  .empty-icon {
    display: block;
    font-size: 1.5rem;
    color: var(--text-muted);
    opacity: 0.3;
    margin-bottom: 0.75rem;
  }

  .empty-message {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1rem;
  }
</style>
