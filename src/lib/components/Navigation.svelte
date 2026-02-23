<script lang="ts">
  import type { View } from "../types";
  import { appState } from "../stores/state.svelte";

  const navItems: { view: View; label: string; icon: string }[] = [
    { view: "active", label: "Reading", icon: "\u{25CB}" },
    { view: "completed", label: "Finished", icon: "\u{25C7}" },
    { view: "settings", label: "Settings", icon: "\u{25E6}" },
    { view: "import-export", label: "Import / Export", icon: "\u{25A1}" },
  ];

  function handleNavClick(view: View) {
    appState.setView(view);
  }
</script>

<nav class="navigation">
  <div class="nav-inner">
    {#each navItems as item}
      <button
        class="nav-button"
        class:active={appState.currentView === item.view}
        onclick={() => handleNavClick(item.view)}
      >
        <span class="nav-icon">{item.icon}</span>
        <span class="nav-label">{item.label}</span>
      </button>
    {/each}
  </div>
</nav>

<style>
  .navigation {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-subtle);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .nav-inner {
    display: flex;
    gap: 0;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .nav-button {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.85rem 1.25rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-weight: 400;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
    position: relative;
    transition: color var(--transition-base);
  }

  .nav-icon {
    font-size: 0.65rem;
    opacity: 0.6;
    transition: opacity var(--transition-base);
  }

  .nav-button:hover {
    color: var(--text-secondary);
  }

  .nav-button:hover .nav-icon {
    opacity: 0.8;
  }

  .nav-button.active {
    color: var(--gold-300);
  }

  .nav-button.active .nav-icon {
    opacity: 1;
    color: var(--gold-400);
  }

  .nav-button.active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 1.25rem;
    right: 1.25rem;
    height: 1.5px;
    background: var(--gold-400);
    animation: fadeIn var(--transition-base) ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scaleX(0.5); }
    to { opacity: 1; transform: scaleX(1); }
  }
</style>
