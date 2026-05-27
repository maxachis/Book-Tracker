<script lang="ts">
  import { appState } from "../lib/stores/state.svelte";

  const progressLabel: Record<string, string> = {
    page: "pages",
    location: "locations",
    percentage: "%",
  };

  function formatDate(iso: string): string {
    if (!iso) return "";
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  $effect(() => {
    if (appState.currentView === "today") {
      appState.refreshDailySummary();
    }
  });
</script>

<div class="today-view">
  <div class="today-header">
    <h2 class="today-title">Today</h2>
    <p class="today-date">{formatDate(today)}</p>
  </div>

  {#if appState.dailySummary.books.length === 0}
    <div class="empty-state">
      <span class="empty-icon">&#9671;</span>
      <p>Nothing logged yet today.</p>
      <p class="empty-sub">Update your progress in Reading to record a session.</p>
    </div>
  {:else}
    <div class="session-list">
      {#each appState.dailySummary.books as session}
        <div class="session-card">
          <div class="session-title">{session.title}</div>
          <div class="session-delta">
            +{session.progress_delta}
            <span class="session-unit">{progressLabel[session.progress_type] ?? session.progress_type}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .today-view {
    max-width: 640px;
  }

  .today-header {
    margin-bottom: 2rem;
  }

  .today-title {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--gold-100);
    margin: 0 0 0.25rem 0;
    letter-spacing: 0.02em;
  }

  .today-date {
    margin: 0;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1rem;
    color: var(--text-muted);
    letter-spacing: 0.03em;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 4rem 2rem;
    color: var(--text-muted);
    text-align: center;
  }

  .empty-icon {
    font-size: 1.5rem;
    color: var(--gold-600);
    opacity: 0.5;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    margin: 0;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.05rem;
    color: var(--text-secondary);
  }

  .empty-sub {
    font-size: 0.9rem !important;
    color: var(--text-muted) !important;
  }

  .session-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .session-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem;
    transition: border-color var(--transition-fast);
  }

  .session-card:hover {
    border-color: var(--border-medium);
  }

  .session-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  .session-delta {
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--accent-green);
    white-space: nowrap;
  }

  .session-unit {
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--text-muted);
    margin-left: 0.2rem;
  }
</style>
