export type ProgressType = "page" | "location" | "percentage";

export interface Book {
  id: string;
  title: string;
  author: string | null;
  current_progress: number;
  total_progress: number;
  progress_type: ProgressType;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CreateBookRequest {
  title: string;
  author: string | null;
  total_progress: number;
  progress_type: ProgressType;
  target_date: string | null;
}

export interface UpdateBookRequest {
  id: string;
  title?: string;
  author?: string | null;
  current_progress?: number;
  total_progress?: number;
  progress_type?: ProgressType;
  target_date?: string | null;
}

export interface UserSettings {
  id: number;
  reading_start_hour: number;
  reading_end_hour: number;
  stats_start_date: string | null;
}

export interface UpdateSettingsRequest {
  reading_start_hour?: number;
  reading_end_hour?: number;
  stats_start_date?: string | null;
}

export type SortField = "target_date" | "title" | "progress" | "created_at";
/** The Reading tab adds the hand-arranged order and urgency of the next page. */
export type ReadingSortField = SortField | "custom" | "next_due";
export type SortDirection = "asc" | "desc";

export interface SortConfig<F extends string = SortField> {
  field: F;
  direction: SortDirection;
}

export interface SortOption<F extends string = SortField> {
  value: F;
  label: string;
}

export type View = "active" | "completed" | "today" | "settings" | "import-export";

export interface BookSessionSummary {
  book_id: string;
  title: string;
  progress_delta: number;
  progress_type: string;
}

export interface DailyReadingSummary {
  date: string;
  books: BookSessionSummary[];
}

export interface ReadingGoal {
  pagesPerDay: number;
  pagesPerHour: number;
  pagesPerHourToday: number | null; // Rate needed from now until end of reading hours today
  daysRemaining: number;
  isOverdue: boolean;
}

export interface Statistics {
  totalBooks: number;
  completedBooks: number;
  activeBooks: number;
  completionRate: number;
}

export interface DailyGoal {
  start: number;
  end: number;
}
