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
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export type View = "active" | "completed" | "settings" | "import-export";

export interface ReadingGoal {
  pagesPerDay: number;
  pagesPerHour: number;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface Statistics {
  totalBooks: number;
  completedBooks: number;
  activeBooks: number;
  completionRate: number;
}
