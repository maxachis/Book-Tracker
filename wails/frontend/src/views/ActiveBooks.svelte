<script lang="ts">
  import type {
    Book,
    CreateBookRequest,
    DailyGoal,
    ReadingSortField,
    SortConfig,
    UpdateBookRequest,
  } from "../lib/types";
  import { appState } from "../lib/stores/state.svelte";
  import { createBook, updateBook, deleteBook, markBookComplete } from "../lib/services/database";
  import { defaultDailyGoal } from "../lib/services/calculations";
  import BookCard from "../lib/components/BookCard.svelte";
  import BookSidebar from "../lib/components/BookSidebar.svelte";
  import SortControls from "../lib/components/SortControls.svelte";
  import { CUSTOM_ORDER, READING_SORT_OPTIONS } from "../lib/services/sorting";

  /** What "Add Book" creates; the reader fills in the real details on the card. */
  const NEW_BOOK_DEFAULTS: CreateBookRequest = {
    title: "Untitled Book",
    author: null,
    total_progress: 300,
    progress_type: "page",
    target_date: null,
  };

  let selectedId = $state<string | null>(null);
  /** The book just created by "Add Book", whose title opens ready to type. */
  let newBookId = $state<string | null>(null);

  // Until the reader picks one, show the top book. If the picked book is
  // completed or deleted it drops out of the list and this falls back too.
  const selectedBook = $derived(
    appState.sortedReadingBooks.find((b) => b.id === selectedId) ?? appState.sortedReadingBooks[0]
  );

  // The sidebar shows today's goal for every book, so each needs one even
  // before its card has been opened.
  $effect(() => {
    for (const book of appState.books) {
      if (!appState.getDailyGoal(book.id)) {
        appState.setDailyGoal(book.id, defaultDailyGoal(book, appState.settings));
      }
    }
  });

  function dailyGoalFor(book: Book): DailyGoal {
    return appState.getDailyGoal(book.id) ?? defaultDailyGoal(book, appState.settings);
  }

  /** Keeps the card on the book it's showing when the list order is about to change. */
  function pinShownBook() {
    selectedId = selectedBook?.id ?? null;
  }

  // The sidebar reports the order as shown, so a move made while sorted
  // becomes the new custom order.
  function handleReorder(bookIds: string[]) {
    pinShownBook();
    if (appState.readingSort.field !== CUSTOM_ORDER) {
      appState.setReadingSort({ ...appState.readingSort, field: CUSTOM_ORDER });
    }
    void appState.reorderBooks(bookIds);
  }

  function handleSort(config: SortConfig<ReadingSortField>) {
    pinShownBook();
    appState.setReadingSort(config);
  }

  async function handleFieldUpdate(book: Book, changes: Omit<UpdateBookRequest, "id">) {
    await updateBook({ id: book.id, ...changes });
    await appState.refreshBooks();
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

  // New books have no saved position, so the reading order puts them on top.
  async function handleAddBook() {
    const created = await createBook(NEW_BOOK_DEFAULTS);
    // Mark it before refreshing: its card mounts as soon as it appears in the
    // list, and only reads "open title for editing" at mount.
    selectedId = created.id;
    newBookId = created.id;
    await appState.refreshBooks();
  }
</script>

<div class="active-books">
  <div class="header">
    <div class="header-text">
      <h2>Currently Reading</h2>
      <span class="book-count">{appState.orderedBooks.length} book{appState.orderedBooks.length !== 1 ? "s" : ""}</span>
    </div>
    <div class="header-actions">
      {#if appState.sortedReadingBooks.length > 0}
        <SortControls
          sortConfig={appState.readingSort}
          options={READING_SORT_OPTIONS}
          onSort={handleSort}
          showCaption={false}
        />
      {/if}
      <button class="btn-add" onclick={handleAddBook}>
        <span class="btn-icon">+</span>
        Add Book
      </button>
    </div>
  </div>

  {#if appState.orderedBooks.length === 0}
    <div class="empty-state">
      <span class="empty-icon">&#9671;</span>
      <p class="empty-message">No active books. Add a book to start tracking your reading.</p>
    </div>
  {:else}
    <div class="reading-layout">
      <aside class="sidebar">
        <BookSidebar
          books={appState.sortedReadingBooks}
          selectedId={selectedBook?.id ?? null}
          getDailyGoal={dailyGoalFor}
          endHour={appState.settings.reading_end_hour}
          locationStep={appState.settings.location_step}
          onSelect={(id) => (selectedId = id)}
          onReorder={handleReorder}
        />
      </aside>

      <section class="detail">
        {#if selectedBook}
          {#key selectedBook.id}
            <BookCard
              book={selectedBook}
              settings={appState.settings}
              onFieldUpdate={handleFieldUpdate}
              editTitleOnOpen={selectedBook.id === newBookId}
              onDelete={handleDelete}
              onProgressUpdate={handleProgressUpdate}
              onMarkComplete={handleMarkComplete}
            />
          {/key}
        {/if}
      </section>
    </div>
  {/if}
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
    gap: 1rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
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

  /* Sidebar stays first in the DOM (keyboard order) but sits on the right. */
  .reading-layout {
    display: grid;
    grid-template-columns: 1fr minmax(240px, 300px);
    grid-template-areas: "detail sidebar";
    gap: 1.25rem;
    align-items: start;
  }

  .sidebar {
    grid-area: sidebar;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
  }

  .detail {
    grid-area: detail;
    min-width: 0;
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
