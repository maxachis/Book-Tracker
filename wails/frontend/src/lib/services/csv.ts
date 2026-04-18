import {
  OpenCSVFile,
  SaveCSVFile,
  ParseCSVBooks,
  CheckDuplicates,
  GenerateCSVExport,
} from "../../../wailsjs/go/main/App";
import { getAllBooks, createBook } from "./database";

export async function importBooks(): Promise<{ imported: number; message: string }> {
  const csvContent = await OpenCSVFile();

  if (!csvContent) {
    return { imported: 0, message: "No file selected" };
  }

  const parsedBooks = await ParseCSVBooks(csvContent);

  const duplicates = await CheckDuplicates(parsedBooks);
  if (duplicates && duplicates.length > 0) {
    const names = duplicates
      .map((d) => (d.author ? `${d.title} by ${d.author}` : d.title))
      .join(", ");
    throw new Error(`Duplicate books found: ${names}`);
  }

  let imported = 0;
  for (const record of parsedBooks) {
    await createBook({
      title: record.title,
      author: record.author ?? null,
      total_progress: record.total_progress,
      progress_type: record.progress_type as "page" | "location" | "percentage",
      target_date: record.target_date ?? null,
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

  const csvContent = await GenerateCSVExport(books as any);

  const saved = await SaveCSVFile("books-export.csv", csvContent);

  if (!saved) {
    return { exported: 0, message: "Export cancelled" };
  }

  return {
    exported: books.length,
    message: `Successfully exported ${books.length} book${books.length !== 1 ? "s" : ""}`,
  };
}
