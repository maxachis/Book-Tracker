import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { Book } from "../types";
import { getAllBooks, createBook } from "./database";

interface CsvBookRecord {
  title: string;
  author: string | null;
  current_progress: number;
  total_progress: number;
  progress_type: string;
  target_date: string | null;
  completed_at: string | null;
}

export async function importBooks(): Promise<{ imported: number; message: string }> {
  const filePath = await open({
    multiple: false,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });

  if (!filePath) {
    return { imported: 0, message: "No file selected" };
  }

  const csvContent = await readTextFile(filePath as string);

  // Parse CSV using Rust
  const parsedBooks: CsvBookRecord[] = await invoke("parse_csv_books", {
    csvContent: csvContent,
  });

  // Get existing books for duplicate check
  const existingBooks = await getAllBooks();

  // Check for duplicates using Rust
  await invoke("check_duplicates", {
    newBooks: parsedBooks,
    existingBooks: existingBooks,
  });

  // Import all books
  let imported = 0;
  for (const record of parsedBooks) {
    await createBook({
      title: record.title,
      author: record.author,
      total_progress: record.total_progress,
      progress_type: record.progress_type as "page" | "location" | "percentage",
      target_date: record.target_date,
    });
    imported++;
  }

  return {
    imported,
    message: `Successfully imported ${imported} book${imported !== 1 ? "s" : ""}`,
  };
}

export async function exportBooks(): Promise<{ exported: number; message: string }> {
  const books = await getAllBooks();

  if (books.length === 0) {
    return { exported: 0, message: "No books to export" };
  }

  const csvContent: string = await invoke("generate_csv_export", { books });

  const filePath = await save({
    filters: [{ name: "CSV", extensions: ["csv"] }],
    defaultPath: "books-export.csv",
  });

  if (!filePath) {
    return { exported: 0, message: "Export cancelled" };
  }

  await writeTextFile(filePath, csvContent);

  return {
    exported: books.length,
    message: `Successfully exported ${books.length} book${books.length !== 1 ? "s" : ""}`,
  };
}
