<script lang="ts">
  import type { SortField, SortDirection, SortConfig } from "../types";
  import Dropdown from "./Dropdown.svelte";

  interface Props {
    sortConfig: SortConfig;
    onSort: (config: SortConfig) => void;
  }

  let { sortConfig, onSort }: Props = $props();

  const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: "created_at", label: "Date Added" },
    { value: "title", label: "Title" },
    { value: "target_date", label: "Target Date" },
    { value: "progress", label: "Progress" },
  ];

  function handleFieldChange(field: SortField) {
    onSort({ field, direction: sortConfig.direction });
  }

  const DIRECTION_DISPLAY: Record<SortDirection, { arrow: string; name: string }> = {
    asc: { arrow: "\u2191", name: "Ascending" },
    desc: { arrow: "\u2193", name: "Descending" },
  };
  const direction = $derived(DIRECTION_DISPLAY[sortConfig.direction]);

  function toggleDirection() {
    const newDirection: SortDirection =
      sortConfig.direction === "asc" ? "desc" : "asc";
    onSort({ field: sortConfig.field, direction: newDirection });
  }
</script>

<div class="sort-controls">
  <div class="sort-label">
    <span class="label-text" aria-hidden="true">Sort</span>
    <Dropdown
      label="Sort"
      options={SORT_OPTIONS}
      value={sortConfig.field}
      onChange={handleFieldChange}
    />
  </div>
  <button
    class="direction-button"
    aria-label={direction.name}
    title={direction.name}
    onclick={toggleDirection}
  >
    {direction.arrow}
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

  .direction-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.9rem;
    padding: 0.3rem 0;
    border: 1px solid var(--border-medium);
    background: transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.9rem;
    line-height: 1;
    color: var(--text-muted);
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }

  .direction-button:hover {
    color: var(--gold-300);
    border-color: var(--gold-500);
  }
</style>
