import type { Book, UserSettings, View, Statistics, DailyGoal, DailyReadingSummary } from "../types";
import {
  getActiveBooks,
  getCompletedBooks,
  getAllBooks,
  getSettings,
  getDailyReadingSummary,
  getBookOrder,
  setBookOrder,
} from "../services/database";
import { applyCustomOrder } from "../services/ordering";
import { calculateStatistics } from "../services/calculations";
import { localDateISO } from "../services/dates";

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
  /** Book IDs in the reader's saved order. */
  customOrder = $state<string[]>([]);
  isLoading = $state(true);
  error = $state<string | null>(null);
  dailyGoals = $state<Map<string, DailyGoal>>(new Map());
  dailySummary = $state<DailyReadingSummary>({ date: "", books: [] });

  get statistics(): Statistics {
    const allBooks = [...this.books, ...this.completedBooks];
    return calculateStatistics(allBooks, this.settings.stats_start_date);
  }

  /** Reading books in the reader's hand-arranged order (new books first). */
  get orderedBooks(): Book[] {
    return applyCustomOrder(this.books, this.customOrder);
  }

  async loadData() {
    this.isLoading = true;
    this.error = null;
    try {
      const today = localDateISO();
      const [activeBooks, completedBooks, settings, dailySummary, customOrder] = await Promise.all([
        getActiveBooks(),
        getCompletedBooks(),
        getSettings(),
        getDailyReadingSummary(today),
        getBookOrder(),
      ]);
      this.books = activeBooks;
      this.completedBooks = completedBooks;
      this.settings = settings;
      this.dailySummary = dailySummary;
      this.customOrder = customOrder;
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to load data";
    } finally {
      this.isLoading = false;
    }
  }

  async refreshDailySummary() {
    try {
      const today = localDateISO();
      this.dailySummary = await getDailyReadingSummary(today);
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to refresh daily summary";
    }
  }

  async refreshBooks() {
    try {
      const today = localDateISO();
      const [activeBooks, completedBooks, dailySummary] = await Promise.all([
        getActiveBooks(),
        getCompletedBooks(),
        getDailyReadingSummary(today),
      ]);
      this.books = activeBooks;
      this.completedBooks = completedBooks;
      this.dailySummary = dailySummary;
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

  /** Saves a hand-arranged order. */
  async reorderBooks(bookIds: string[]) {
    this.customOrder = bookIds;
    try {
      await setBookOrder(bookIds);
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to save book order";
    }
  }

  setView(view: View) {
    this.currentView = view;
  }

  clearError() {
    this.error = null;
  }

  getDailyGoal(bookId: string): DailyGoal | undefined {
    return this.dailyGoals.get(bookId);
  }

  setDailyGoal(bookId: string, goal: DailyGoal) {
    const newMap = new Map(this.dailyGoals);
    newMap.set(bookId, goal);
    this.dailyGoals = newMap;
  }
}

export const appState = new AppState();
