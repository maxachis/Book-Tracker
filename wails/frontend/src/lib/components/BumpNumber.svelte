<script lang="ts">
  interface Props {
    value: number;
  }

  let { value }: Props = $props();

  // svelte-ignore state_referenced_locally
  let lastValue = value;
  /** Bumped on each change so the lift animation replays; 0 means unchanged since first shown. */
  let changes = $state(0);

  $effect.pre(() => {
    if (value !== lastValue) {
      lastValue = value;
      changes += 1;
    }
  });
</script>

{#key changes}
  <span class="bump-number" class:bump={changes > 0}>{value}</span>
{/key}

<style>
  .bump-number {
    display: inline-block;
  }

  /* A short lift and brighten when the number changes. */
  .bump {
    animation: bump 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes bump {
    35% {
      transform: translateY(-3px);
      color: var(--gold-200);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bump {
      animation: brighten 400ms ease-out;
    }
    @keyframes brighten {
      from {
        color: var(--gold-200);
      }
    }
  }
</style>
