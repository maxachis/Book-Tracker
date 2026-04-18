<script lang="ts">
  import { appState } from "../lib/stores/state.svelte";
  import { importBooks, exportBooks } from "../lib/services/csv";

  let isImporting = $state(false);
  let isExporting = $state(false);
  let message = $state<{ type: "success" | "error"; text: string } | null>(null);

  async function handleImport() {
    message = null;
    isImporting = true;

    try {
      const result = await importBooks();
      if (result.imported > 0) {
        await appState.refreshBooks();
        message = { type: "success", text: result.message };
      } else {
        message = { type: "error", text: result.message };
      }
    } catch (e) {
      message = {
        type: "error",
        text: e instanceof Error ? e.message : "Import failed",
      };
    } finally {
      isImporting = false;
    }
  }

  async function handleExport() {
    message = null;
    isExporting = true;

    try {
      const result = await exportBooks();
      if (result.exported > 0) {
        message = { type: "success", text: result.message };
      } else {
        message = { type: "error", text: result.message };
      }
    } catch (e) {
      message = {
        type: "error",
        text: e instanceof Error ? e.message : "Export failed",
      };
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="import-export">
  <h2>Import / Export</h2>

  {#if message}
    <div class="message {message.type}">{message.text}</div>
  {/if}

  <div class="section">
    <div class="section-header">
      <h3>Import Books</h3>
      <span class="section-ornament">&#9671;</span>
    </div>
    <p class="description">
      Import books from a CSV file. The CSV must have the following columns:
    </p>
    <div class="csv-format">
      <div class="csv-item"><span class="csv-required">title</span> Book title</div>
      <div class="csv-item"><span class="csv-optional">author</span> Author name</div>
      <div class="csv-item"><span class="csv-optional">current_progress</span> Current reading progress</div>
      <div class="csv-item"><span class="csv-required">total_progress</span> Total pages/locations/percentage</div>
      <div class="csv-item"><span class="csv-required">progress_type</span> "page", "location", or "percentage"</div>
      <div class="csv-item"><span class="csv-optional">target_date</span> Target completion date (YYYY-MM-DD)</div>
      <div class="csv-item"><span class="csv-optional">completed_at</span> Completion date (YYYY-MM-DD)</div>
    </div>
    <div class="warning">
      Import will be rejected if any book matches an existing book by title and author.
    </div>
    <button class="btn btn-import" onclick={handleImport} disabled={isImporting}>
      {isImporting ? "Importing..." : "Import from CSV"}
    </button>
  </div>

  <div class="section">
    <div class="section-header">
      <h3>Export Books</h3>
      <span class="section-ornament">&#9671;</span>
    </div>
    <p class="description">
      Export all your books to a CSV file. This can be used for backup or to import into
      another instance.
    </p>
    <div class="info-box">
      <span class="info-value">{appState.books.length + appState.completedBooks.length}</span> books to export
    </div>
    <button class="btn btn-export" onclick={handleExport} disabled={isExporting}>
      {isExporting ? "Exporting..." : "Export to CSV"}
    </button>
  </div>
</div>

<style>
  .import-export {
    max-width: 600px;
  }

  h2 {
    margin: 0 0 1.5rem 0;
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--gold-100);
  }

  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--gold-200);
  }

  .message {
    padding: 0.65rem 0.85rem;
    border-radius: var(--radius-sm);
    margin-bottom: 1rem;
    font-size: 0.85rem;
    border: 1px solid transparent;
  }

  .message.error {
    background: rgba(196, 114, 114, 0.1);
    color: var(--accent-red);
    border-color: rgba(196, 114, 114, 0.2);
  }

  .message.success {
    background: rgba(122, 182, 122, 0.1);
    color: var(--accent-green);
    border-color: rgba(122, 182, 122, 0.2);
  }

  .section {
    background: var(--bg-card);
    padding: 1.25rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-subtle);
    margin-bottom: 1rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .section-ornament {
    color: var(--gold-500);
    opacity: 0.3;
    font-size: 0.8rem;
  }

  .description {
    color: var(--text-muted);
    font-size: 0.85rem;
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .csv-format {
    background: rgba(212, 185, 120, 0.03);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 0.85rem;
    margin: 0 0 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .csv-item {
    font-size: 0.8rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .csv-required,
  .csv-optional {
    font-family: "Courier New", monospace;
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    min-width: 130px;
    display: inline-block;
  }

  .csv-required {
    background: rgba(212, 185, 120, 0.1);
    color: var(--gold-300);
    border: 1px solid rgba(212, 185, 120, 0.15);
  }

  .csv-optional {
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
  }

  .warning {
    background: rgba(212, 164, 74, 0.08);
    color: var(--accent-amber);
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(212, 164, 74, 0.15);
    font-size: 0.82rem;
    margin: 0 0 1rem 0;
  }

  .info-box {
    font-size: 0.82rem;
    color: var(--gold-300);
    background: rgba(212, 185, 120, 0.05);
    border: 1px solid var(--border-subtle);
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-sm);
    margin-bottom: 1rem;
  }

  .info-value {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
  }

  .btn {
    padding: 0.6rem 1.25rem;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition: background var(--transition-fast);
  }

  .btn-import {
    background: var(--accent-amber);
    color: var(--bg-deep);
  }

  .btn-import:hover:not(:disabled) {
    background: var(--gold-400);
  }

  .btn-export {
    background: var(--gold-500);
    color: var(--bg-deep);
  }

  .btn-export:hover:not(:disabled) {
    background: var(--gold-400);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
