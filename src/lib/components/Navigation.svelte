<script lang="ts">
  import type { View } from "../types";
  import { appState } from "../stores/state.svelte";

  const navItems: { view: View; label: string }[] = [
    { view: "active", label: "Active Books" },
    { view: "completed", label: "Completed" },
    { view: "settings", label: "Settings" },
    { view: "import-export", label: "Import/Export" },
  ];

  function handleNavClick(view: View) {
    appState.setView(view);
  }
</script>

<nav class="navigation">
  {#each navItems as item}
    <button
      class="nav-button"
      class:active={appState.currentView === item.view}
      onclick={() => handleNavClick(item.view)}
    >
      {item.label}
    </button>
  {/each}
</nav>

<style>
  .navigation {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  .nav-button {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.9rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .nav-button:hover {
    background: #e0e0e0;
  }

  .nav-button.active {
    background: #2196f3;
    color: white;
  }
</style>
