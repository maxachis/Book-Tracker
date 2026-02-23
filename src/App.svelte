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
    <div class="header-inner">
      <div class="brand">
        <span class="brand-icon">&#9671;</span>
        <h1>Book Tracker</h1>
      </div>
      <p class="tagline">Your reading, measured.</p>
    </div>
  </header>

  <Navigation />

  <main class="app-main">
    {#if appState.isLoading}
      <div class="loading">
        <div class="loading-spinner"></div>
        <span>Loading your library...</span>
      </div>
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

  <footer class="app-footer">
    <span class="footer-rule"></span>
  </footer>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(:root) {
    --bg-deep: #0f0e0c;
    --bg-primary: #1a1814;
    --bg-card: #22201b;
    --bg-card-hover: #2a2722;
    --bg-surface: #2e2b25;
    --bg-input: #1a1814;

    --gold-100: #f5e6c8;
    --gold-200: #e8d5a3;
    --gold-300: #d4b978;
    --gold-400: #c9a84c;
    --gold-500: #b8943f;
    --gold-600: #9a7a32;

    --text-primary: #e8e0d4;
    --text-secondary: #a89f91;
    --text-muted: #7a7268;
    --text-gold: #d4b978;

    --accent-green: #7ab67a;
    --accent-green-dim: #3d5c3d;
    --accent-red: #c47272;
    --accent-red-dim: #5c3030;
    --accent-amber: #d4a04a;
    --accent-purple: #a882c4;

    --border-subtle: rgba(212, 185, 120, 0.08);
    --border-medium: rgba(212, 185, 120, 0.15);
    --border-gold: rgba(212, 185, 120, 0.3);

    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
    --shadow-glow: 0 0 20px rgba(212, 185, 120, 0.06);

    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;

    --font-display: "Cormorant Garamond", "Georgia", serif;
    --font-body: "Libre Franklin", "Helvetica Neue", sans-serif;

    --transition-fast: 150ms ease;
    --transition-base: 250ms ease;
    --transition-slow: 400ms ease;
  }

  :global(body) {
    margin: 0;
    font-family: var(--font-body);
    background: var(--bg-deep);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(::selection) {
    background: rgba(212, 185, 120, 0.3);
    color: var(--gold-100);
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212, 185, 120, 0.03) 0%, transparent 60%),
      var(--bg-deep);
  }

  .app-header {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-medium);
    position: relative;
    overflow: hidden;
  }

  .app-header::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-600), transparent);
    opacity: 0.4;
  }

  .header-inner {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  .brand {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }

  .brand-icon {
    color: var(--gold-400);
    font-size: 1rem;
    opacity: 0.8;
  }

  .app-header h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--gold-100);
    letter-spacing: 0.02em;
  }

  .tagline {
    margin: 0;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.95rem;
    color: var(--text-muted);
    letter-spacing: 0.03em;
  }

  .app-main {
    flex: 1;
    padding: 2rem 1.5rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 2rem;
    color: var(--text-secondary);
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.1rem;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-medium);
    border-top-color: var(--gold-400);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    background: var(--accent-red-dim);
    color: var(--accent-red);
    padding: 1.25rem;
    border-radius: var(--radius-md);
    border: 1px solid rgba(196, 114, 114, 0.2);
    text-align: center;
  }

  .error p {
    margin: 0 0 1rem 0;
  }

  .error button {
    padding: 0.5rem 1.25rem;
    background: var(--accent-red);
    color: var(--bg-deep);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-body);
    font-weight: 500;
    font-size: 0.85rem;
    transition: opacity var(--transition-fast);
  }

  .error button:hover {
    opacity: 0.85;
  }

  .app-footer {
    padding: 1.5rem;
  }

  .footer-rule {
    display: block;
    max-width: 1200px;
    margin: 0 auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-medium), transparent);
  }
</style>
