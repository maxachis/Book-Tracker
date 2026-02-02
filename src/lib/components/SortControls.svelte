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
  <label>
    Sort by:
    <select value={sortConfig.field} onchange={handleFieldChange}>
      {#each sortOptions as option}
        <option value={option.field}>{option.label}</option>
      {/each}
    </select>
  </label>
  <button class="direction-button" onclick={toggleDirection}>
    {sortConfig.direction === "asc" ? "↑ Asc" : "↓ Desc"}
  </button>
</div>

<style>
  .sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }

  select {
    padding: 0.3rem 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .direction-button {
    padding: 0.3rem 0.5rem;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .direction-button:hover {
    background: #f5f5f5;
  }
</style>
