<script lang="ts">
  import type { SortField, SortDirection, SortConfig } from "../types";

  interface Props {
    sortConfig: SortConfig;
    onSort: (config: SortConfig) => void;
  }

  let { sortConfig, onSort }: Props = $props();

  const sortOptions: { field: SortField; label: string }[] = [
    { field: "created_at", label: "Date Added" },
    { field: "title", label: "Title" },
    { field: "target_date", label: "Target Date" },
    { field: "progress", label: "Progress" },
  ];

  function handleFieldChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    onSort({ field: target.value as SortField, direction: sortConfig.direction });
  }

  function toggleDirection() {
    const newDirection: SortDirection =
      sortConfig.direction === "asc" ? "desc" : "asc";
    onSort({ field: sortConfig.field, direction: newDirection });
  }
</script>

<div class="sort-controls">
  <label class="sort-label">
    <span class="label-text">Sort by</span>
    <select value={sortConfig.field} onchange={handleFieldChange}>
      {#each sortOptions as option}
        <option value={option.field}>{option.label}</option>
      {/each}
    </select>
  </label>
  <button class="direction-button" onclick={toggleDirection}>
    {sortConfig.direction === "asc" ? "\u2191 Asc" : "\u2193 Desc"}
  </button>
</div>

<style>
  .sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }

  .sort-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .label-text {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  select {
    padding: 0.3rem 0.5rem;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    color: var(--text-secondary);
    font-family: var(--font-body);
    font-size: 0.8rem;
    cursor: pointer;
    transition: border-color var(--transition-fast);
  }

  select:focus {
    outline: none;
    border-color: var(--gold-500);
  }

  select option {
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .direction-button {
    padding: 0.3rem 0.6rem;
    border: 1px solid var(--border-medium);
    background: transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.8rem;
    color: var(--text-muted);
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }

  .direction-button:hover {
    color: var(--gold-300);
    border-color: var(--gold-500);
  }
</style>
