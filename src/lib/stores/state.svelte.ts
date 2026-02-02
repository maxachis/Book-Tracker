import type { Book, UserSettings, View, SortConfig, Statistics } from "../types";
import {
  getActiveBooks,
  getCompletedBooks,
  getAllBooks,
  getSettings,
} from "../services/database";
import { calculateStatistics } from "../services/calculations";

class AppState {
  books = $state<Book[]>([]);
  completedBooks = $state<Book[]>([]);
  settings = $state<UserSettings>({
    id: 1,
    reading_start_hour: 8,
    reading_end_hour: 22,
    stats_start_date: null,
  });
  currentView = $state<View>("active");
  sortConfig = $state<SortConfig>({ field: "created_at", direction: "desc" });
  isLoading = $state(true);
  error = $state<string | null>(null);

  get statistics(): Statistics {
    const allBooks = [...this.books, ...this.completedBooks];
    return calculateStatistics(allBooks, this.settings.stats_start_date);
  }

  get sortedBooks(): Book[] {
    return [...this.books].sort((a, b) => {
      const { field, direction } = this.sortConfig;
      const multiplier = direction === "asc" ? 1 : -1;

      switch (field) {
        case "title":
          return multiplier * a.title.localeCompare(b.title);
        case "target_date":
          if (!a.target_date && !b.target_date) return 0;
          if (!a.target_date) return 1;
          if (!b.target_date) return -1;
          return (
            multiplier *
            (new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
          );
        case "progress":
          const aPercent = a.current_progress / a.total_progress;
          const bPercent = b.current_progress / b.total_progress;
          return multiplier * (aPercent - bPercent);
        case "created_at":
        default:
          return (
            multiplier *
            (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          );
      }
    });
  }

  async loadData() {
    this.isLoading = true;
    this.error = null;
    try {
      const [activeBooks, completedBooks, settings] = await Promise.all([
        getActiveBooks(),
        getCompletedBooks(),
        getSettings(),
      ]);
      this.books = activeBooks;
      this.completedBooks = completedBooks;
      this.settings = settings;
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to load data";
    } finally {
      this.isLoading = false;
    }
  }

  async refreshBooks() {
    try {
      const [activeBooks, completedBooks] = await Promise.all([
        getActiveBooks(),
        getCompletedBooks(),
      ]);
      this.books = activeBooks;
      this.completedBooks = completedBooks;
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to refresh books";
    }
  }

  async refreshSettings() {
    try {
      this.settings = await getSettings();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to refresh settings";
    }
  }

  setView(view: View) {
    this.currentView = view;
  }

  setSortConfig(config: SortConfig) {
    this.sortConfig = config;
  }

  clearError() {
    this.error = null;
  }
}

export const appState = new AppState();
