<script lang="ts" generics="T extends string">
  interface Props {
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
    /** Accessible name for the control. */
    label: string;
    size?: "sm" | "md";
  }

  let { options, value, onChange, label, size = "md" }: Props = $props();

  const uid = $props.id();
  const listboxId = `${uid}-listbox`;
  const optionId = (index: number) => `${uid}-option-${index}`;

  let isOpen = $state(false);
  let activeIndex = $state(0);
  let rootEl = $state<HTMLDivElement | null>(null);

  const selectedIndex = $derived(Math.max(0, options.findIndex((o) => o.value === value)));
  const selectedLabel = $derived(options[selectedIndex]?.label ?? "");

  function open() {
    activeIndex = selectedIndex;
    isOpen = true;
  }

  function close() {
    isOpen = false;
  }

  function choose(index: number) {
    close();
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
  }

  function moveActive(step: number) {
    activeIndex = Math.min(options.length - 1, Math.max(0, activeIndex + step));
  }

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) open();
        else moveActive(e.key === "ArrowDown" ? 1 : -1);
        break;
      case "Home":
      case "End":
        if (!isOpen) return;
        e.preventDefault();
        activeIndex = e.key === "Home" ? 0 : options.length - 1;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (isOpen) choose(activeIndex);
        else open();
        break;
      case "Escape":
        if (!isOpen) return;
        e.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
    }
  }

  function handleDocumentPointerDown(e: PointerEvent) {
    if (isOpen && rootEl && !rootEl.contains(e.target as Node)) close();
  }
</script>

<svelte:document onpointerdown={handleDocumentPointerDown} />

<div class="dropdown size-{size}" bind:this={rootEl}>
  <div
    class="trigger"
    class:open={isOpen}
    role="combobox"
    tabindex="0"
    aria-label={label}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-controls={listboxId}
    aria-activedescendant={isOpen ? optionId(activeIndex) : undefined}
    onclick={() => (isOpen ? close() : open())}
    onkeydown={handleKeyDown}
  >
    <!-- Every label shares one grid cell; the hidden ones size the button to the longest. -->
    <span class="trigger-text">
      <span class="trigger-label">{selectedLabel}</span>
      {#each options as option (option.value)}
        <span class="trigger-sizer" aria-hidden="true">{option.label}</span>
      {/each}
    </span>
    <svg class="chevron" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </div>

  {#if isOpen}
    <ul class="menu" id={listboxId} role="listbox" aria-label={label}>
      {#each options as option, index (option.value)}
        <!-- Keyboard handling lives on the combobox (aria-activedescendant pattern). -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          id={optionId(index)}
          class="option"
          class:active={index === activeIndex}
          class:selected={option.value === value}
          role="option"
          aria-selected={option.value === value}
          onpointerenter={() => (activeIndex = index)}
          onclick={() => choose(index)}
        >
          {option.label}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
    display: inline-block;
    font-family: var(--font-body);
  }

  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.3rem 0.5rem 0.3rem 0.65rem;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 0.8rem;
    cursor: pointer;
    user-select: none;
    transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  }

  .size-sm .trigger {
    padding: 0.2rem 0.4rem 0.2rem 0.5rem;
    font-size: 0.75rem;
    background: var(--bg-input);
  }

  .trigger:hover {
    border-color: var(--border-gold);
    color: var(--gold-200);
  }

  .trigger:focus-visible,
  .trigger.open {
    outline: none;
    border-color: var(--gold-500);
    color: var(--gold-200);
  }

  .trigger-text {
    display: grid;
    white-space: nowrap;
  }

  .trigger-text > * {
    grid-area: 1 / 1;
  }

  .trigger-sizer {
    visibility: hidden;
  }

  .chevron {
    width: 0.75rem;
    height: 0.75rem;
    color: var(--text-muted);
    transition: transform var(--transition-fast);
  }

  .trigger.open .chevron {
    transform: rotate(180deg);
    color: var(--gold-400);
  }

  .menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 50;
    min-width: 100%;
    margin: 0;
    padding: 0.25rem;
    list-style: none;
    background: var(--bg-surface);
    border: 1px solid var(--border-gold);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    animation: menu-in 120ms ease-out;
  }

  @keyframes menu-in {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
  }

  .option {
    padding: 0.35rem 0.55rem;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 0.8rem;
    white-space: nowrap;
    cursor: pointer;
  }

  .size-sm .option {
    font-size: 0.75rem;
  }

  .option.active {
    background: rgba(212, 185, 120, 0.1);
    color: var(--gold-100);
  }

  .option.selected {
    color: var(--gold-300);
    font-weight: 600;
  }
</style>
