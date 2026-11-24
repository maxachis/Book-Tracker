<script lang="ts">
  interface Props {
    value: number;
  }

  let { value }: Props = $props();

  // svelte-ignore state_referenced_locally
  let lastValue = value;
  /** Bumped on each change so the animation replays; 0 means unchanged since first shown. */
  let changes = $state(0);
  /** Rising numbers lift; falling ones dip. */
  let wentDown = $state(false);

  $effect.pre(() => {
    if (value !== lastValue) {
      wentDown = value < lastValue;
      lastValue = value;
      changes += 1;
    }
  });
</script>

{#key changes}
  <span class="bump-number" class:bump={changes > 0 && !wentDown} class:bump-down={changes > 0 && wentDown}
    >{value}</span
  >
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

  /* The mirror image for a decrease: a short dip and dim. */
  .bump-down {
    animation: bump-down 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes bump-down {
    35% {
      transform: translateY(3px);
      color: var(--text-muted);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bump {
      animation: brighten 400ms ease-out;
    }
    .bump-down {
      animation: dim 400ms ease-out;
    }
    @keyframes dim {
      from {
        color: var(--text-muted);
      }
    }
    @keyframes brighten {
      from {
        color: var(--gold-200);
      }
    }
  }
</style>
