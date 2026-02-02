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
    <h2>Active Books</h2>
    <button class="btn-add" onclick={handleAddBook}>+ Add Book</button>
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
    emptyMessage="No active books. Add a book to start tracking your reading!"
  />
</div>

<style>
  .active-books {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h2 {
    margin: 0;
    color: #333;
  }

  .btn-add {
    padding: 0.5rem 1rem;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .btn-add:hover {
    background: #43a047;
  }

  .form-container {
    margin-bottom: 1rem;
  }
</style>
