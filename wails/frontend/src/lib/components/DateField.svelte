<script lang="ts">
  import { tick } from "svelte";
  import DatePicker from "./DatePicker.svelte";

  interface Props {
    /** ISO "YYYY-MM-DD", or null when unset. */
    value: string | null;
    /** Accessible name; the trigger reads "Edit {label}". */
    label: string;
    onSave: (iso: string) => void;
    placeholder?: string;
    format?: (iso: string) => string;
    /** ISO date -> titles of other books already targeting that day. */
    markedDates?: Map<string, string[]>;
    /** "inline" reads as card text; "input" looks like a form field. */
    variant?: "inline" | "input";
    /** When given, a clear button is shown while a date is set. */
    onClear?: () => void;
  }

  let {
    value,
    label,
    onSave,
    placeholder = "",
    format = (iso) => iso,
    markedDates,
    variant = "inline",
    onClear,
  }: Props = $props();

  let isOpen = $state(false);
  let rootEl = $state<HTMLSpanElement | null>(null);
  let triggerEl = $state<HTMLButtonElement | null>(null);

  async function open() {
    isOpen = true;
    await tick();
    // Put keyboard focus on the calendar's current day so arrows work at once.
    rootEl?.querySelector<HTMLElement>('.date-popover [tabindex="0"]')?.focus();
  }

  function close({ restoreFocus }: { restoreFocus: boolean }) {
    isOpen = false;
    if (restoreFocus) triggerEl?.focus();
  }

  function pick(iso: string) {
    close({ restoreFocus: true });
    if (iso !== value) onSave(iso);
  }

  function handleDocumentPointerDown(e: PointerEvent) {
    if (isOpen && rootEl && !rootEl.contains(e.target as Node)) close({ restoreFocus: false });
  }
</script>

<svelte:document onpointerdown={handleDocumentPointerDown} />

<span class="date-field" class:input-variant={variant === "input"} bind:this={rootEl}>
  <button
    bind:this={triggerEl}
    type="button"
    class={variant === "input" ? "date-input" : "editable-display"}
    class:placeholder={!value}
    class:open={isOpen}
    aria-label="Edit {label}"
    aria-haspopup="dialog"
    aria-expanded={isOpen}
    onclick={() => (isOpen ? close({ restoreFocus: false }) : open())}
  >
    {value ? format(value) : placeholder}
    {#if variant === "input"}
      <svg class="calendar-icon" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3" />
        <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
      </svg>
    {/if}
  </button>

  {#if onClear && value}
    <button type="button" class="clear" aria-label="Clear {label}" title="Clear" onclick={onClear}>&times;</button>
  {/if}

  {#if isOpen}
    <div class="date-popover" role="dialog" aria-label="Choose {label}">
      <DatePicker
        {value}
        {markedDates}
        onSelect={pick}
        onClose={() => close({ restoreFocus: true })}
      />
    </div>
  {/if}
</span>

<style>
  .date-field {
    position: relative;
    display: inline-block;
  }

  /* Matches the click-to-edit fields elsewhere on the card. */
  .editable-display {
    all: unset;
    cursor: pointer;
    border-radius: var(--radius-sm);
    padding: 0 0.2rem;
    margin: 0 -0.2rem;
    border-bottom: 1px dashed transparent;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .editable-display:hover,
  .editable-display:focus-visible,
  .editable-display.open {
    border-bottom-color: var(--border-gold);
    background: rgba(212, 185, 120, 0.05);
  }

  .editable-display.placeholder {
    color: var(--text-muted);
    font-style: italic;
    opacity: 0.7;
  }

  .date-field.input-variant {
    display: block;
  }

  /* Matches the text inputs on the book form. */
  .date-input {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-input);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.9rem;
    cursor: pointer;
    transition: border-color var(--transition-fast);
  }

  .date-input:focus-visible,
  .date-input.open {
    border-color: var(--gold-500);
  }

  .date-input.placeholder {
    color: var(--text-muted);
  }

  .calendar-icon {
    width: 0.95rem;
    height: 0.95rem;
    margin-left: auto;
    color: var(--text-muted);
  }

  .clear {
    all: unset;
    position: absolute;
    top: 50%;
    right: 2.1rem;
    transform: translateY(-50%);
    padding: 0 0.3rem;
    color: var(--text-muted);
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    border-radius: var(--radius-sm);
  }

  .clear:hover,
  .clear:focus-visible {
    color: var(--gold-200);
  }

  .date-popover {
    position: absolute;
    top: calc(100% + 6px);
    left: -0.2rem;
    z-index: 60;
    animation: popover-in 120ms ease-out;
  }

  @keyframes popover-in {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
  }
</style>
