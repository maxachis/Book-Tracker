import type {
  Book,
  UserSettings,
  View,
  Statistics,
  DailyGoal,
  DailyReadingSummary,
  ReadingSortField,
  SortConfig,
} from "../types";
import {
  getActiveBooks,
  getCompletedBooks,
  getAllBooks,
  getSettings,
  getDailyReadingSummary,
  getBookOrder,
  setBookOrder,
  getDailyGoals,
  saveDailyGoal,
} from "../services/database";
import { applyCustomOrder } from "../services/ordering";
import { calculateStatistics, defaultDailyGoal } from "../services/calculations";
import { DEFAULT_READING_SORT, sortReadingBooks } from "../services/sorting";
import { dueClock } from "./dueClock.svelte";
import { DEFAULT_LOCATION_STEP } from "../services/countdown";
import { localDateISO } from "../services/dates";

class AppState {
  books = $state<Book[]>([]);
  completedBooks = $state<Book[]>([]);
  settings = $state<UserSettings>({
    id: 1,
    reading_start_hour: 8,
    reading_end_hour: 22,
    stats_start_date: null,
    location_step: DEFAULT_LOCATION_STEP,
  });
  currentView = $state<View>("active");
  /** Book IDs in the reader's saved order. */
  customOrder = $state<string[]>([]);
  /** How the Reading tab is sorted; kept for the session, not saved. */
  readingSort = $state<SortConfig<ReadingSortField>>(DEFAULT_READING_SORT);
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

  /**
   * Reading books as the sidebar lists them: the chosen sort over the custom
   * order. Sorting by next page due re-reads the ticking clock, so the list
   * re-sorts as countdowns restart.
   */
  get sortedReadingBooks(): Book[] {
    return sortReadingBooks(this.orderedBooks, {
      config: this.readingSort,
      nextDueAt: (book) => this.#nextDueAt(book),
    });
  }

  #nextDueAt(book: Book): Date | null {
    const goal = this.getDailyGoal(book.id) ?? defaultDailyGoal(book, this.settings);
    return dueClock.deadlineFor({
      bookId: book.id,
      current: book.current_progress,
      goal,
      endHour: this.settings.reading_end_hour,
      progressType: book.progress_type,
      locationStep: this.settings.location_step,
    });
  }

  async loadData() {
    this.isLoading = true;
    this.error = null;
    try {
      const today = localDateISO();
      const [activeBooks, completedBooks, settings, dailySummary, customOrder, dailyGoals] = await Promise.all([
        getActiveBooks(),
        getCompletedBooks(),
        getSettings(),
        getDailyReadingSummary(today),
        getBookOrder(),
        getDailyGoals(today),
      ]);
      this.dailyGoals = dailyGoals;
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

  setReadingSort(config: SortConfig<ReadingSortField>) {
    this.readingSort = config;
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

  /** Updates the goal immediately, then saves it for today (best effort). */
  async setDailyGoal(bookId: string, goal: DailyGoal) {
    const newMap = new Map(this.dailyGoals);
    newMap.set(bookId, goal);
    this.dailyGoals = newMap;
    try {
      await saveDailyGoal({ bookId, date: localDateISO(), goal });
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to save daily goal";
    }
  }
}

export const appState = new AppState();
