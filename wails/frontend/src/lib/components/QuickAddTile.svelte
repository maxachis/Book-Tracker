<script lang="ts">
  import { onDestroy } from "svelte";
  import { HOLD_DELAY_MS, repeatStageAt } from "../services/holdRepeat";

  interface Props {
    /** Accessible name, e.g. "+1 page"; the -1 button reads the same with a minus. */
    label: string;
    /** Small word under the "+1", e.g. "page". */
    unit: string;
    /** Called with how much to add: 1 for a tap, the held total after a hold. */
    onAdd: (amount: number) => void;
    /** Called with how much to take back, the same way. */
    onRemove?: (amount: number) => void;
    /** The most a hold can add (what's left in the book). */
    maxAdd?: number;
    /** The most a hold can take back (progress so far). */
    maxRemove?: number;
    /** Keep adding while held, faster over time (location books). */
    repeatOnHold?: boolean;
    disabled?: boolean;
    removeDisabled?: boolean;
  }

  let {
    label,
    unit,
    onAdd,
    onRemove,
    maxAdd = Infinity,
    maxRemove = Infinity,
    repeatOnHold = false,
    disabled = false,
    removeDisabled = false,
  }: Props = $props();

  const removeLabel = $derived(label.replace(/^\+/, "-"));

  type Direction = "add" | "remove";
  const SIGN: Record<Direction, 1 | -1> = { add: 1, remove: -1 };

  /** How long after the last press the running count waits before floating off. */
  const BURST_IDLE_MS = 1000;
  /** Matches the length of the badge's float-off animation. */
  const BURST_LEAVE_MS = 450;

  /** Net change of the current burst: presses up count +, presses down count -. */
  let burstCount = $state(0);
  let showBurst = $state(false);
  let leaving = $state(false);
  /** Bumped on every press so the badge's pop animation replays. */
  let popKey = $state(0);
  let held = $state(false);
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;

  function clearTimers() {
    clearTimeout(idleTimer);
    clearTimeout(leaveTimer);
    clearTimeout(holdTimer);
  }

  function countPress(delta: number) {
    leaving = false;
    showBurst = true;
    burstCount += delta;
    popKey += 1;
    scheduleBurstFade();
  }

  /** Floats the running count off after a quiet spell (not while still held). */
  function scheduleBurstFade() {
    clearTimeout(idleTimer);
    clearTimeout(leaveTimer);
    if (holding) return;
    idleTimer = setTimeout(() => {
      leaving = true;
      leaveTimer = setTimeout(() => {
        burstCount = 0;
        showBurst = false;
        leaving = false;
      }, BURST_LEAVE_MS);
    }, BURST_IDLE_MS);
  }

  const burstText = $derived(burstCount < 0 ? `\u2212${-burstCount}` : `+${burstCount}`);

  function isBlocked(direction: Direction): boolean {
    return direction === "add" ? disabled : removeDisabled || !onRemove;
  }

  function report(direction: Direction, amount: number) {
    if (direction === "add") onAdd(amount);
    else onRemove?.(amount);
  }

  // Holding (when enabled): after a pause the amount climbs, faster the
  // longer it's held, and is saved once on release.
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let holdDirection: Direction = "add";
  let repeatStartedAt = 0;
  let heldAmount = 0;
  let holding = false;
  /** A hold ends in a pointerup whose click must not add or remove another 1. */
  let suppressNextClick = false;

  function handlePointerDown(e: PointerEvent, direction: Direction) {
    if (!repeatOnHold || isBlocked(direction) || e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    holdDirection = direction;
    heldAmount = 0;
    holding = true;
    holdTimer = setTimeout(() => {
      repeatStartedAt = Date.now();
      repeatTick();
    }, HOLD_DELAY_MS);
  }

  function repeatTick() {
    const stage = repeatStageAt(Date.now() - repeatStartedAt);
    const limit = holdDirection === "add" ? maxAdd : maxRemove;
    const step = Math.min(stage.step, limit - heldAmount);
    if (step <= 0) return;
    heldAmount += step;
    countPress(SIGN[holdDirection] * step);
    holdTimer = setTimeout(repeatTick, stage.intervalMs);
  }

  function endHold() {
    clearTimeout(holdTimer);
    if (!holding) return;
    holding = false;
    if (heldAmount > 0) {
      scheduleBurstFade();
      suppressNextClick = true;
      report(holdDirection, heldAmount);
      heldAmount = 0;
    }
  }

  function handleClick(direction: Direction) {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    if (isBlocked(direction)) return;
    countPress(SIGN[direction]);
    report(direction, 1);
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
    onclick={() => handleClick("add")}
    onpointerdown={(e) => handlePointerDown(e, "add")}
    onpointerup={endHold}
    onpointercancel={endHold}
    onkeydown={handleKeyDown}
    onkeyup={() => (held = false)}
    onblur={() => (held = false)}
  >
    <span class="plus" aria-hidden="true">+1</span>
    <span class="unit" aria-hidden="true">{unit}</span>
  </button>
  {#if onRemove}
    <button
      type="button"
      class="quick-remove"
      aria-label={removeLabel}
      disabled={removeDisabled}
      onclick={() => handleClick("remove")}
      onpointerdown={(e) => handlePointerDown(e, "remove")}
      onpointerup={endHold}
      onpointercancel={endHold}
    >
      <span aria-hidden="true">&minus;1</span>
    </button>
  {/if}
  {#if showBurst}
    {#key popKey}
      <span class="burst" class:leaving class:negative={burstCount < 0} aria-hidden="true">{burstText}</span>
    {/key}
  {/if}
</div>

<style>
  /* The big +1 fills the cell; the squat -1 sits underneath. */
  .tile-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
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

  .quick-remove {
    flex: none;
    height: 1.5rem;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    font-variant-numeric: lining-nums;
    line-height: 1;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast),
      transform 280ms cubic-bezier(0.34, 1.8, 0.64, 1);
  }

  .quick-remove:hover:not(:disabled) {
    color: var(--gold-300);
    border-color: var(--gold-500);
  }

  .quick-remove:focus-visible {
    outline: 2px solid var(--gold-400);
    outline-offset: 2px;
  }

  .quick-remove:active:not(:disabled) {
    transform: translateY(1px) scale(0.97);
    transition-duration: 60ms;
  }

  .quick-remove:disabled {
    cursor: default;
    opacity: 0.4;
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

  /* A net decrease reads as a correction, not a gain. */
  .burst.negative {
    background: var(--bg-surface);
    color: var(--gold-300);
    border: 1px solid var(--border-medium);
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
    .quick-add-tile.held:not(:disabled),
    .quick-remove:active:not(:disabled) {
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
