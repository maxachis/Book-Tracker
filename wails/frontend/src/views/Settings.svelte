<script lang="ts">
  import { appState } from "../lib/stores/state.svelte";
  import { updateSettings } from "../lib/services/database";

  let readingStartHour = $state(appState.settings.reading_start_hour);
  let readingEndHour = $state(appState.settings.reading_end_hour);
  let statsStartDate = $state(appState.settings.stats_start_date ?? "");
  let isSaving = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  const stats = $derived(appState.statistics);

  async function handleSave() {
    error = null;
    success = null;
    isSaving = true;

    try {
      await updateSettings({
        reading_start_hour: readingStartHour,
        reading_end_hour: readingEndHour,
        stats_start_date: statsStartDate || null,
      });
      await appState.refreshSettings();
      success = "Settings saved successfully";
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to save settings";
    } finally {
      isSaving = false;
    }
  }

  $effect(() => {
    readingStartHour = appState.settings.reading_start_hour;
    readingEndHour = appState.settings.reading_end_hour;
    statsStartDate = appState.settings.stats_start_date ?? "";
  });
</script>

<div class="settings">
  <h2>Settings</h2>

  {#if error}
    <div class="message error">{error}</div>
  {/if}

  {#if success}
    <div class="message success">{success}</div>
  {/if}

  <div class="settings-section">
    <div class="section-header">
      <h3>Reading Hours</h3>
      <span class="section-ornament">&#9671;</span>
    </div>
    <p class="description">
      Set your typical reading hours. This is used to calculate pages per hour goals.
    </p>

    <div class="form-row">
      <div class="form-group">
        <label for="startHour">Start Hour</label>
        <select id="startHour" bind:value={readingStartHour}>
          {#each Array.from({ length: 24 }, (_, i) => i) as hour}
            <option value={hour}>{hour.toString().padStart(2, "0")}:00</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="endHour">End Hour</label>
        <select id="endHour" bind:value={readingEndHour}>
          {#each Array.from({ length: 24 }, (_, i) => i) as hour}
            <option value={hour}>{hour.toString().padStart(2, "0")}:00</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="info-box">
      <span class="info-value">{readingEndHour - readingStartHour}</span> hours available per day
    </div>
  </div>

  <div class="settings-section">
    <div class="section-header">
      <h3>Statistics</h3>
      <span class="section-ornament">&#9671;</span>
    </div>
    <p class="description">
      Set a start date to filter statistics. Only books created after this date will be
      included in statistics.
    </p>

    <div class="form-group">
      <label for="statsStartDate">Statistics Start Date</label>
      <input id="statsStartDate" type="date" bind:value={statsStartDate} />
    </div>

    <div class="stats-display">
      <div class="stat-item">
        <span class="stat-value">{stats.totalBooks}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-item">
        <span class="stat-value stat-completed">{stats.completedBooks}</span>
        <span class="stat-label">Completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-value stat-active">{stats.activeBooks}</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{stats.completionRate}%</span>
        <span class="stat-label">Rate</span>
      </div>
    </div>
  </div>

  <button class="btn-save" onclick={handleSave} disabled={isSaving}>
    {isSaving ? "Saving..." : "Save Settings"}
  </button>
</div>

<style>
  .settings {
    max-width: 600px;
  }

  h2 {
    margin: 0 0 1.5rem 0;
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--gold-100);
  }

  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--gold-200);
  }

  .message {
    padding: 0.65rem 0.85rem;
    border-radius: var(--radius-sm);
    margin-bottom: 1rem;
    font-size: 0.85rem;
    border: 1px solid transparent;
  }

  .message.error {
    background: rgba(196, 114, 114, 0.1);
    color: var(--accent-red);
    border-color: rgba(196, 114, 114, 0.2);
  }

  .message.success {
    background: rgba(122, 182, 122, 0.1);
    color: var(--accent-green);
    border-color: rgba(122, 182, 122, 0.2);
  }

  .settings-section {
    background: var(--bg-card);
    padding: 1.25rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-subtle);
    margin-bottom: 1rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .section-ornament {
    color: var(--gold-500);
    opacity: 0.3;
    font-size: 0.8rem;
  }

  .description {
    color: var(--text-muted);
    font-size: 0.85rem;
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .form-row {
    display: flex;
    gap: 1rem;
  }

  .form-group {
    flex: 1;
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  select,
  input {
    width: 100%;
    padding: 0.5rem 0.65rem;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-input);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.9rem;
    box-sizing: border-box;
    transition: border-color var(--transition-fast);
  }

  select:focus,
  input:focus {
    outline: none;
    border-color: var(--gold-500);
  }

  select option {
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .info-box {
    font-size: 0.82rem;
    color: var(--gold-300);
    background: rgba(212, 185, 120, 0.05);
    border: 1px solid var(--border-subtle);
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-sm);
  }

  .info-value {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
  }

  .stats-display {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem 0.5rem;
    background: rgba(212, 185, 120, 0.03);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--gold-300);
    line-height: 1.2;
  }

  .stat-completed {
    color: var(--accent-green);
  }

  .stat-active {
    color: var(--accent-amber);
  }

  .stat-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 0.15rem;
  }

  .btn-save {
    padding: 0.6rem 1.5rem;
    background: var(--gold-500);
    color: var(--bg-deep);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition: background var(--transition-fast);
  }

  .btn-save:hover:not(:disabled) {
    background: var(--gold-400);
  }

  .btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
