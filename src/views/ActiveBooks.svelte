<script lang="ts">
  import type { Book, CreateBookRequest, UpdateBookRequest } from "../lib/types";
  import { appState } from "../lib/stores/state.svelte";
  import { createBook, updateBook, deleteBook, markBookComplete } from "../lib/services/database";
  import BookList from "../lib/components/BookList.svelte";
  import BookForm from "../lib/components/BookForm.svelte";

  let showForm = $state(false);
  let editingBook = $state<Book | undefined>(undefined);

  async function handleSubmit(data: CreateBookRequest | UpdateBookRequest) {
    if ("id" in data) {
      await updateBook(data);
    } else {
      await createBook(data);
    }
    await appState.refreshBooks();
    showForm = false;
    editingBook = undefined;
  }

  function handleEdit(book: Book) {
    editingBook = book;
    showForm = true;
  }

  async function handleDelete(book: Book) {
    await deleteBook(book.id);
    await appState.refreshBooks();
  }

  async function handleProgressUpdate(book: Book, progress: number) {
    await updateBook({ id: book.id, current_progress: progress });
    await appState.refreshBooks();
  }

  async function handleMarkComplete(book: Book) {
    await markBookComplete(book.id);
    await appState.refreshBooks();
  }

  function handleCancel() {
    showForm = false;
    editingBook = undefined;
  }

  function handleAddBook() {
    editingBook = undefined;
    showForm = true;
  }
</script>

<div class="active-books">
  <div class="header">
    <div class="header-text">
      <h2>Currently Reading</h2>
      <span class="book-count">{appState.sortedBooks.length} book{appState.sortedBooks.length !== 1 ? "s" : ""}</span>
    </div>
    <button class="btn-add" onclick={handleAddBook}>
      <span class="btn-icon">+</span>
      Add Book
    </button>
  </div>

  {#if showForm}
    <div class="form-container">
      <BookForm book={editingBook} onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  {/if}

  <BookList
    books={appState.sortedBooks}
    settings={appState.settings}
    sortConfig={appState.sortConfig}
    onSort={(config) => appState.setSortConfig(config)}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onProgressUpdate={handleProgressUpdate}
    onMarkComplete={handleMarkComplete}
    emptyMessage="No active books. Add a book to start tracking your reading."
  />
</div>

<style>
  .active-books {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-text {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--gold-100);
  }

  .book-count {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  .btn-add {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--gold-500);
    color: var(--bg-deep);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition: background var(--transition-fast);
  }

  .btn-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .btn-add:hover {
    background: var(--gold-400);
  }

  .form-container {
    margin-bottom: 0.5rem;
  }
</style>
