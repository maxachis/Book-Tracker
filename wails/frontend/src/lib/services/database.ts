import {
  CreateBook,
  ListActiveBooks,
  ListCompletedBooks,
  ListAllBooks,
  UpdateBook,
  DeleteBook,
  MarkBookComplete,
  MarkBookIncomplete,
  GetSettings,
  UpdateSettings,
  GetDailyReadingSummary,
} from "../../../wailsjs/go/main/App";
import type {
  Book,
  CreateBookRequest,
  UpdateBookRequest,
  UserSettings,
  UpdateSettingsRequest,
  DailyReadingSummary,
} from "../types";

function normalizeBook(b: any): Book {
  return {
    id: b.id,
    title: b.title,
    author: b.author ?? null,
    current_progress: b.current_progress,
    total_progress: b.total_progress,
    progress_type: b.progress_type,
    target_date: b.target_date ?? null,
    completed_at: b.completed_at ?? null,
    created_at: b.created_at,
  };
}

function normalizeSettings(s: any): UserSettings {
  return {
    id: s.id,
    reading_start_hour: s.reading_start_hour,
    reading_end_hour: s.reading_end_hour,
    stats_start_date: s.stats_start_date ?? null,
  };
}

export async function createBook(request: CreateBookRequest): Promise<Book> {
  const book = await CreateBook(request as any);
  return normalizeBook(book);
}

export async function getActiveBooks(): Promise<Book[]> {
  const books = await ListActiveBooks();
  return books.map(normalizeBook);
}

export async function getCompletedBooks(): Promise<Book[]> {
  const books = await ListCompletedBooks();
  return books.map(normalizeBook);
}

export async function getAllBooks(): Promise<Book[]> {
  const books = await ListAllBooks();
  return books.map(normalizeBook);
}

export async function updateBook(request: UpdateBookRequest): Promise<Book> {
  const book = await UpdateBook(request as any);
  return normalizeBook(book);
}

export async function deleteBook(id: string): Promise<void> {
  await DeleteBook(id);
}

export async function markBookComplete(id: string): Promise<Book> {
  const book = await MarkBookComplete(id);
  return normalizeBook(book);
}

export async function markBookIncomplete(id: string): Promise<Book> {
  const book = await MarkBookIncomplete(id);
  return normalizeBook(book);
}

export async function getSettings(): Promise<UserSettings> {
  const settings = await GetSettings();
  return normalizeSettings(settings);
}

export async function updateSettings(
  request: UpdateSettingsRequest
): Promise<UserSettings> {
  const settings = await UpdateSettings(request as any);
  return normalizeSettings(settings);
}

export async function getDailyReadingSummary(date: string): Promise<DailyReadingSummary> {
  const raw = await GetDailyReadingSummary(date);
  return {
    date: raw.date,
    books: (raw.books ?? []).map((b: any) => ({
      book_id: b.book_id,
      title: b.title,
      progress_delta: b.progress_delta,
      progress_type: b.progress_type,
    })),
  };
}
