<script lang="ts">
  import { tick } from "svelte";

  type InputType = "text" | "number" | "date";

  interface Props {
    value: string;
    /** Accessible name; the trigger is announced as "Edit {label}". */
    label: string;
    onSave: (value: string) => Promise<void> | void;
    inputType?: InputType;
    placeholder?: string;
    required?: boolean;
    format?: (value: string) => string;
    min?: number;
    class?: string;
    /** Open already in edit mode with the input focused. */
    startEditing?: boolean;
  }

  let {
    value,
    label,
    onSave,
    inputType = "text",
    placeholder = "",
    required = false,
    format,
    min,
    class: className = "",
    startEditing = false,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let isEditing = $state(startEditing);
  // svelte-ignore state_referenced_locally
  let draft = $state(value);

  const displayText = $derived(value ? (format ? format(value) : value) : placeholder);

  function beginEditing() {
    draft = value;
    isEditing = true;
  }

  /** Focus the input as soon as it appears and select its text once the bound value is filled in. */
  function focusOnMount(input: HTMLInputElement) {
    input.focus();
    void tick().then(() => input.select?.());
  }

  async function commit() {
    if (!isEditing) return;
    isEditing = false;
    const next = String(draft).trim();
    if (next === value || (required && next === "")) return;
    await onSave(next);
  }

  function cancel() {
    isEditing = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }
</script>

{#if isEditing}
  <input
    use:focusOnMount
    class="editable-input {className}"
    type={inputType}
    aria-label={label}
    {min}
    bind:value={draft}
    onkeydown={handleKeyDown}
    onblur={commit}
  />
{:else}
  <button
    type="button"
    class="editable-display {className}"
    class:placeholder={!value}
    aria-label="Edit {label}"
    title="Click to edit"
    onclick={beginEditing}
  >
    {displayText}
  </button>
{/if}

<style>
  .editable-display {
    all: unset;
    cursor: text;
    border-radius: var(--radius-sm);
    padding: 0 0.2rem;
    margin: 0 -0.2rem;
    border-bottom: 1px dashed transparent;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .editable-display:hover,
  .editable-display:focus-visible {
    border-bottom-color: var(--border-gold);
    background: rgba(212, 185, 120, 0.05);
  }

  .editable-display.placeholder {
    color: var(--text-muted);
    font-style: italic;
    opacity: 0.7;
  }

  .editable-input {
    font: inherit;
    color: var(--text-primary);
    background: var(--bg-input);
    border: 1px solid var(--gold-500);
    border-radius: var(--radius-sm);
    padding: 0.1rem 0.3rem;
    max-width: 100%;
    outline: none;
  }

  .editable-input[type="number"] {
    width: 5rem;
  }
</style>
