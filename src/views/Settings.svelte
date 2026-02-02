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
    <h3>Reading Hours</h3>
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

    <p class="info">
      Available reading hours per day: {readingEndHour - readingStartHour} hours
    </p>
  </div>

  <div class="settings-section">
    <h3>Statistics</h3>
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
        <span class="stat-label">Total Books</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{stats.completedBooks}</span>
        <span class="stat-label">Completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{stats.activeBooks}</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{stats.completionRate}%</span>
        <span class="stat-label">Completion Rate</span>
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
    color: #333;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    color: #444;
  }

  .message {
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .message.error {
    background: #ffebee;
    color: #c62828;
  }

  .message.success {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .settings-section {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
  }

  .description {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
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
    margin-bottom: 0.3rem;
    font-size: 0.9rem;
    color: #666;
  }

  select,
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .info {
    margin: 0;
    font-size: 0.85rem;
    color: #1976d2;
    background: #e3f2fd;
    padding: 0.5rem;
    border-radius: 4px;
  }

  .stats-display {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-top: 1rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1976d2;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #666;
  }

  .btn-save {
    padding: 0.75rem 1.5rem;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .btn-save:hover:not(:disabled) {
    background: #1976d2;
  }

  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
