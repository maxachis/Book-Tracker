import Database from "@tauri-apps/plugin-sql";
import { invoke } from "@tauri-apps/api/core";
import type {
  Book,
  CreateBookRequest,
  UpdateBookRequest,
  UserSettings,
  UpdateSettingsRequest,
} from "../types";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:book-tracker.db");
  }
  return db;
}

// Book operations
export async function createBook(request: CreateBookRequest): Promise<Book> {
  await invoke("validate_book_request", { request });

  const id: string = await invoke("generate_book_id");
  const created_at: string = await invoke("get_current_timestamp");

  const database = await getDb();
  await database.execute(
    `INSERT INTO books (id, title, author, current_progress, total_progress, progress_type, target_date, created_at)
     VALUES ($1, $2, $3, 0, $4, $5, $6, $7)`,
    [
      id,
      request.title,
      request.author,
      request.total_progress,
      request.progress_type,
      request.target_date,
      created_at,
    ]
  );

  return {
    id,
    title: request.title,
    author: request.author,
    current_progress: 0,
    total_progress: request.total_progress,
    progress_type: request.progress_type,
    target_date: request.target_date,
    completed_at: null,
    created_at,
  };
}

export async function getActiveBooks(): Promise<Book[]> {
  const database = await getDb();
  const result = await database.select<Book[]>(
    `SELECT id, title, author, current_progress, total_progress, progress_type, target_date, completed_at, created_at
     FROM books
     WHERE completed_at IS NULL
     ORDER BY created_at DESC`
  );
  return result;
}

export async function getCompletedBooks(): Promise<Book[]> {
  const database = await getDb();
  const result = await database.select<Book[]>(
    `SELECT id, title, author, current_progress, total_progress, progress_type, target_date, completed_at, created_at
     FROM books
     WHERE completed_at IS NOT NULL
     ORDER BY completed_at DESC`
  );
  return result;
}

export async function getAllBooks(): Promise<Book[]> {
  const database = await getDb();
  const result = await database.select<Book[]>(
    `SELECT id, title, author, current_progress, total_progress, progress_type, target_date, completed_at, created_at
     FROM books
     ORDER BY created_at DESC`
  );
  return result;
}

export async function updateBook(request: UpdateBookRequest): Promise<Book> {
  const database = await getDb();

  // Get existing book
  const existing = await database.select<Book[]>(
    `SELECT * FROM books WHERE id = $1`,
    [request.id]
  );

  if (existing.length === 0) {
    throw new Error("Book not found");
  }

  const book = existing[0];
  const title = request.title ?? book.title;
  const author = request.author !== undefined ? request.author : book.author;
  const current_progress = request.current_progress ?? book.current_progress;
  const total_progress = request.total_progress ?? book.total_progress;
  const progress_type = request.progress_type ?? book.progress_type;
  const target_date =
    request.target_date !== undefined ? request.target_date : book.target_date;

  // Validate progress
  await invoke("validate_progress_update", {
    current: current_progress,
    total: total_progress,
    progressType: progress_type,
  });

  // Determine completed_at
  let completed_at = book.completed_at;
  if (current_progress >= total_progress && !book.completed_at) {
    completed_at = await invoke("get_current_timestamp");
  } else if (current_progress < total_progress) {
    completed_at = null;
  }

  await database.execute(
    `UPDATE books
     SET title = $1, author = $2, current_progress = $3, total_progress = $4, progress_type = $5, target_date = $6, completed_at = $7
     WHERE id = $8`,
    [
      title,
      author,
      current_progress,
      total_progress,
      progress_type,
      target_date,
      completed_at,
      request.id,
    ]
  );

  return {
    id: request.id,
    title,
    author,
    current_progress,
    total_progress,
    progress_type,
    target_date,
    completed_at,
    created_at: book.created_at,
  };
}

export async function deleteBook(id: string): Promise<void> {
  const database = await getDb();
  await database.execute(`DELETE FROM books WHERE id = $1`, [id]);
}

export async function markBookComplete(id: string): Promise<Book> {
  const database = await getDb();
  const completed_at: string = await invoke("get_current_timestamp");

  await database.execute(
    `UPDATE books SET current_progress = total_progress, completed_at = $1 WHERE id = $2`,
    [completed_at, id]
  );

  const result = await database.select<Book[]>(
    `SELECT * FROM books WHERE id = $1`,
    [id]
  );

  if (result.length === 0) {
    throw new Error("Book not found");
  }

  return result[0];
}

// Settings operations
export async function getSettings(): Promise<UserSettings> {
  const database = await getDb();
  const result = await database.select<UserSettings[]>(
    `SELECT * FROM user_settings WHERE id = 1`
  );

  if (result.length === 0) {
    // Return default settings
    return {
      id: 1,
      reading_start_hour: 8,
      reading_end_hour: 22,
      stats_start_date: null,
    };
  }

  return result[0];
}

export async function updateSettings(
  request: UpdateSettingsRequest
): Promise<UserSettings> {
  await invoke("validate_settings", { request });

  const database = await getDb();
  const current = await getSettings();

  const reading_start_hour =
    request.reading_start_hour ?? current.reading_start_hour;
  const reading_end_hour =
    request.reading_end_hour ?? current.reading_end_hour;
  const stats_start_date =
    request.stats_start_date !== undefined
      ? request.stats_start_date
      : current.stats_start_date;

  await database.execute(
    `UPDATE user_settings
     SET reading_start_hour = $1, reading_end_hour = $2, stats_start_date = $3
     WHERE id = 1`,
    [reading_start_hour, reading_end_hour, stats_start_date]
  );

  return {
    id: 1,
    reading_start_hour,
    reading_end_hour,
    stats_start_date,
  };
}
