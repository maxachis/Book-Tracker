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
    <h3>Import Books</h3>
    <p class="description">
      Import books from a CSV file. The CSV must have the following columns:
    </p>
    <ul class="csv-format">
      <li><strong>title</strong> (required) - Book title</li>
      <li><strong>author</strong> - Author name</li>
      <li><strong>current_progress</strong> - Current reading progress</li>
      <li><strong>total_progress</strong> (required) - Total pages/locations/percentage</li>
      <li><strong>progress_type</strong> (required) - "page", "location", or "percentage"</li>
      <li><strong>target_date</strong> - Target completion date (YYYY-MM-DD)</li>
      <li><strong>completed_at</strong> - Completion date (YYYY-MM-DD)</li>
    </ul>
    <p class="warning">
      Import will be rejected if any book matches an existing book by title and author.
    </p>
    <button class="btn-import" onclick={handleImport} disabled={isImporting}>
      {isImporting ? "Importing..." : "Import from CSV"}
    </button>
  </div>

  <div class="section">
    <h3>Export Books</h3>
    <p class="description">
      Export all your books to a CSV file. This can be used for backup or to import into
      another instance.
    </p>
    <p class="info">
      You have {appState.books.length + appState.completedBooks.length} books to export.
    </p>
    <button class="btn-export" onclick={handleExport} disabled={isExporting}>
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
    color: #333;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    color: #444;
  }

  .message {
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .message.error {
    background: #ffebee;
    color: #c62828;
  }

  .message.success {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .section {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
  }

  .description {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
  }

  .csv-format {
    background: #f5f5f5;
    padding: 1rem 1rem 1rem 2rem;
    border-radius: 4px;
    font-size: 0.85rem;
    margin: 0 0 1rem 0;
  }

  .csv-format li {
    margin-bottom: 0.25rem;
  }

  .warning {
    background: #fff3e0;
    color: #e65100;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    margin: 0 0 1rem 0;
  }

  .info {
    background: #e3f2fd;
    color: #1565c0;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    margin: 0 0 1rem 0;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .btn-import {
    background: #ff9800;
    color: white;
  }

  .btn-import:hover:not(:disabled) {
    background: #f57c00;
  }

  .btn-export {
    background: #2196f3;
    color: white;
  }

  .btn-export:hover:not(:disabled) {
    background: #1976d2;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
