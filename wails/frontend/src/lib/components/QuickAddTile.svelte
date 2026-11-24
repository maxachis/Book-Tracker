<script lang="ts">
  import { onDestroy } from "svelte";

  interface Props {
    /** Accessible name, e.g. "+1 page". */
    label: string;
    /** Small word under the "+1", e.g. "page". */
    unit: string;
    onAdd: () => void;
    disabled?: boolean;
  }

  let { label, unit, onAdd, disabled = false }: Props = $props();

  /** How long after the last press the running count waits before floating off. */
  const BURST_IDLE_MS = 1000;
  /** Matches the length of the badge's float-off animation. */
  const BURST_LEAVE_MS = 450;

  let burstCount = $state(0);
  let leaving = $state(false);
  /** Bumped on every press so the badge's pop animation replays. */
  let popKey = $state(0);
  let held = $state(false);
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;

  function clearTimers() {
    clearTimeout(idleTimer);
    clearTimeout(leaveTimer);
  }

  function countPress() {
    clearTimers();
    leaving = false;
    burstCount += 1;
    popKey += 1;
    idleTimer = setTimeout(() => {
      leaving = true;
      leaveTimer = setTimeout(() => {
        burstCount = 0;
        leaving = false;
      }, BURST_LEAVE_MS);
    }, BURST_IDLE_MS);
  }

  function handleClick() {
    if (disabled) return;
    countPress();
    onAdd();
  }

  // Keyboard presses get the same held look as a mouse press.
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") held = true;
  }

  onDestroy(clearTimers);
</script>

<div class="tile-wrap">
  <button
    type="button"
    class="quick-add-tile"
    class:held
    aria-label={label}
    {disabled}
    onclick={handleClick}
    onkeydown={handleKeyDown}
    onkeyup={() => (held = false)}
    onblur={() => (held = false)}
  >
    <span class="plus" aria-hidden="true">+1</span>
    <span class="unit" aria-hidden="true">{unit}</span>
  </button>
  {#if burstCount > 0}
    {#key popKey}
      <span class="burst" class:leaving aria-hidden="true">+{burstCount}</span>
    {/key}
  {/if}
</div>

<style>
  .tile-wrap {
    position: relative;
    display: flex;
    height: 100%;
  }

  .quick-add-tile {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    min-width: 6.5rem;
    padding: 0.45rem 1rem;
    border: 1px solid var(--border-gold);
    border-radius: var(--radius-md);
    background: rgba(212, 185, 120, 0.08);
    color: var(--gold-300);
    font: inherit;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    /* The springy curve is for the release; the press itself is near-instant. */
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast),
      transform 280ms cubic-bezier(0.34, 1.8, 0.64, 1);
  }

  .quick-add-tile:hover:not(:disabled) {
    background: rgba(212, 185, 120, 0.12);
    border-color: var(--gold-500);
  }

  .quick-add-tile:focus-visible {
    outline: 2px solid var(--gold-400);
    outline-offset: 2px;
  }

  .quick-add-tile:active:not(:disabled),
  .quick-add-tile.held:not(:disabled) {
    transform: translateY(1px) scale(0.95);
    transition-duration: 60ms;
    background: rgba(212, 185, 120, 0.12);
  }

  .quick-add-tile:disabled {
    cursor: default;
  }

  .plus {
    font-family: var(--font-display);
    font-size: 1.9rem;
    font-weight: 700;
    line-height: 1;
    color: var(--gold-200);
    /* The display face's default old-style "1" reads as an "I". */
    font-variant-numeric: lining-nums;
  }

  .unit {
    font-size: 0.66rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .burst {
    position: absolute;
    right: -0.4rem;
    top: -0.75rem;
    padding: 0.12rem 0.45rem;
    border-radius: 999px;
    background: var(--gold-400);
    color: var(--bg-deep);
    font-size: 0.75rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    box-shadow: var(--shadow-md);
    pointer-events: none;
    animation: pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .burst.leaving {
    animation: leave 450ms ease-in forwards;
  }

  @keyframes pop {
    from {
      transform: scale(1.3);
    }
  }

  @keyframes leave {
    to {
      opacity: 0;
      transform: translateY(-14px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .quick-add-tile:active:not(:disabled),
    .quick-add-tile.held:not(:disabled) {
      transform: none;
    }
    .burst {
      animation: none;
    }
    .burst.leaving {
      animation: fade-out 300ms linear forwards;
    }
    @keyframes fade-out {
      to {
        opacity: 0;
      }
    }
  }
</style>
