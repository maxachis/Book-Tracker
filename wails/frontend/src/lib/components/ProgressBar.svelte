<script lang="ts">
  interface Props {
    percentage: number;
    showLabel?: boolean;
    /** Light up the slice just added whenever the bar grows. */
    glowOnIncrease?: boolean;
  }

  let { percentage, showLabel = true, glowOnIncrease = false }: Props = $props();

  /** How long a highlight lasts; growth within it extends the same highlight. */
  const GLOW_MS = 900;
  /** So a tiny step (one page of a long book) still shows a visible sliver. */
  const MIN_GLOW_WIDTH_PCT = 0.6;

  const clampedPercentage = $derived(Math.min(100, Math.max(0, percentage)));

  // svelte-ignore state_referenced_locally
  let previous = clampedPercentage;
  let glow = $state<{ from: number; to: number; key: number } | null>(null);
  let glowTimer: ReturnType<typeof setTimeout> | undefined;

  $effect.pre(() => {
    const current = clampedPercentage;
    const grew = current > previous;
    const from = glow?.from ?? previous;
    previous = current;
    if (!glowOnIncrease || !grew) return;
    glow = { from, to: current, key: (glow?.key ?? 0) + 1 };
    clearTimeout(glowTimer);
    glowTimer = setTimeout(() => (glow = null), GLOW_MS);
  });

  $effect(() => () => clearTimeout(glowTimer));
</script>

<div class="progress-bar-container">
  <div class="progress-bar">
    <div
      class="progress-fill"
      class:complete={clampedPercentage >= 100}
      style="width: {clampedPercentage}%"
    >
      <div class="progress-shine"></div>
    </div>
    {#if glow}
      {#key glow.key}
        <div
          class="progress-glow"
          style:left="{glow.from}%"
          style:width="{Math.max(MIN_GLOW_WIDTH_PCT, glow.to - glow.from)}%"
        ></div>
      {/key}
    {/if}
  </div>
  {#if showLabel}
    <span class="progress-label" class:complete={clampedPercentage >= 100}>
      {Math.round(clampedPercentage)}%
    </span>
  {/if}
</div>

<style>
  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(212, 185, 120, 0.08);
    border-radius: 3px;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold-600), var(--gold-400));
    border-radius: 3px;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  /* The slice a press just added glows, then settles into the bar. */
  .progress-glow {
    position: absolute;
    top: -2px;
    bottom: -2px;
    border-radius: 3px;
    background: rgba(240, 215, 140, 0.9);
    box-shadow: 0 0 10px 2px rgba(240, 215, 140, 0.9);
    pointer-events: none;
    animation: glow-fade 900ms ease-out forwards;
  }

  @keyframes glow-fade {
    from {
      opacity: 0.95;
    }
    to {
      opacity: 0;
    }
  }

  .progress-fill.complete {
    background: linear-gradient(90deg, var(--accent-green-dim), var(--accent-green));
  }

  .progress-shine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255,255,255,0.15), transparent);
    border-radius: 3px 3px 0 0;
  }

  .progress-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
    min-width: 2.8rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .progress-label.complete {
    color: var(--accent-green);
  }
</style>
