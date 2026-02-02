<script lang="ts">
  import type { Book, CreateBookRequest, UpdateBookRequest, SortConfig } from "../lib/types";
  import { appState } from "../lib/stores/state.svelte";
  import { updateBook, deleteBook } from "../lib/services/database";
  import BookList from "../lib/components/BookList.svelte";
  import BookForm from "../lib/components/BookForm.svelte";

  let showForm = $state(false);
  let editingBook = $state<Book | undefined>(undefined);
  let sortConfig = $state<SortConfig>({ field: "created_at", direction: "desc" });

  const sortedBooks = $derived(() => {
    return [...appState.completedBooks].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === "asc" ? 1 : -1;

      switch (field) {
        case "title":
          return multiplier * a.title.localeCompare(b.title);
        case "target_date":
          if (!a.completed_at && !b.completed_at) return 0;
          if (!a.completed_at) return 1;
          if (!b.completed_at) return -1;
          return (
            multiplier *
            (new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
          );
        case "created_at":
        default:
          return (
            multiplier *
            (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          );
      }
    });
  });

  async function handleSubmit(data: CreateBookRequest | UpdateBookRequest) {
    if ("id" in data) {
      await updateBook(data);
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

  function handleCancel() {
    showForm = false;
    editingBook = undefined;
  }
</script>

<div class="completed-books">
  <div class="header">
    <h2>Completed Books</h2>
    <p class="stats">
      {appState.completedBooks.length} book{appState.completedBooks.length !== 1 ? "s" : ""} completed
    </p>
  </div>

  {#if showForm && editingBook}
    <div class="form-container">
      <BookForm book={editingBook} onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  {/if}

  <BookList
    books={sortedBooks()}
    settings={appState.settings}
    {sortConfig}
    onSort={(config) => (sortConfig = config)}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onProgressUpdate={handleProgressUpdate}
    emptyMessage="No completed books yet. Keep reading!"
  />
</div>

<style>
  .completed-books {
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

  .stats {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .form-container {
    margin-bottom: 1rem;
  }
</style>
