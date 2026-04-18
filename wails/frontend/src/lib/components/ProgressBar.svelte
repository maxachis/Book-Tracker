<script lang="ts">
  interface Props {
    percentage: number;
    showLabel?: boolean;
  }

  let { percentage, showLabel = true }: Props = $props();

  const clampedPercentage = $derived(Math.min(100, Math.max(0, percentage)));
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
    overflow: hidden;
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
