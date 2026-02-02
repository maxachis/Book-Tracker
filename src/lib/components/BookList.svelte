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
    <p class="empty-message">{emptyMessage}</p>
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

  .empty-message {
    text-align: center;
    color: #666;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 8px;
  }
</style>
