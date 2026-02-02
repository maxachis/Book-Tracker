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
    ></div>
  </div>
  {#if showLabel}
    <span class="progress-label">{Math.round(clampedPercentage)}%</span>
  {/if}
</div>

<style>
  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #2196f3;
    transition: width 0.3s ease;
  }

  .progress-fill.complete {
    background: #4caf50;
  }

  .progress-label {
    font-size: 0.8rem;
    color: #666;
    min-width: 3rem;
  }
</style>
