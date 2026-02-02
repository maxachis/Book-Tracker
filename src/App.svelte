<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "./lib/stores/state.svelte";
  import Navigation from "./lib/components/Navigation.svelte";
  import ActiveBooks from "./views/ActiveBooks.svelte";
  import CompletedBooks from "./views/CompletedBooks.svelte";
  import Settings from "./views/Settings.svelte";
  import ImportExport from "./views/ImportExport.svelte";

  onMount(() => {
    appState.loadData();
  });
</script>

<div class="app">
  <header class="app-header">
    <h1>Book Tracker</h1>
  </header>

  <Navigation />

  <main class="app-main">
    {#if appState.isLoading}
      <div class="loading">Loading...</div>
    {:else if appState.error}
      <div class="error">
        <p>{appState.error}</p>
        <button onclick={() => appState.clearError()}>Dismiss</button>
      </div>
    {:else if appState.currentView === "active"}
      <ActiveBooks />
    {:else if appState.currentView === "completed"}
      <CompletedBooks />
    {:else if appState.currentView === "settings"}
      <Settings />
    {:else if appState.currentView === "import-export"}
      <ImportExport />
    {/if}
  </main>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background: #fafafa;
    color: #333;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    background: #1976d2;
    color: white;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .app-header h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .app-main {
    flex: 1;
    padding: 1.5rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .error {
    background: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }

  .error p {
    margin: 0 0 1rem 0;
  }

  .error button {
    padding: 0.5rem 1rem;
    background: #c62828;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .error button:hover {
    background: #b71c1c;
  }
</style>
