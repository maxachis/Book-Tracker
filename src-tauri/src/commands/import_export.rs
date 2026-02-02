use crate::error::AppError;
use crate::models::Book;
use csv::{Reader, Writer};
use std::io::Cursor;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct CsvBookRecord {
    pub title: String,
    pub author: Option<String>,
    pub current_progress: i32,
    pub total_progress: i32,
    pub progress_type: String,
    pub target_date: Option<String>,
    pub completed_at: Option<String>,
}

#[tauri::command]
pub fn parse_csv_books(csv_content: String) -> Result<Vec<CsvBookRecord>, AppError> {
    let cursor = Cursor::new(csv_content);
    let mut reader = Reader::from_reader(cursor);
    let mut books = Vec::new();

    for result in reader.deserialize() {
        let record: CsvBookRecord = result?;

        // Validate progress type
        let valid_types = ["page", "location", "percentage"];
        if !valid_types.contains(&record.progress_type.as_str()) {
            return Err(AppError::from(format!(
                "Invalid progress type '{}' for book '{}'",
                record.progress_type, record.title
            )));
        }

        books.push(record);
    }

    Ok(books)
}

#[tauri::command]
pub fn check_duplicates(
    new_books: Vec<CsvBookRecord>,
    existing_books: Vec<Book>,
) -> Result<(), AppError> {
    for new_book in &new_books {
        for existing in &existing_books {
            let title_match = new_book.title.to_lowercase() == existing.title.to_lowercase();
            let author_match = match (&new_book.author, &existing.author) {
                (Some(new_author), Some(existing_author)) => {
                    new_author.to_lowercase() == existing_author.to_lowercase()
                }
                (None, None) => true,
                _ => false,
            };

            if title_match && author_match {
                let author_display = new_book
                    .author
                    .as_ref()
                    .map(|a| format!(" by {}", a))
                    .unwrap_or_default();
                return Err(AppError::from(format!(
                    "Duplicate book found: '{}'{}. Import rejected.",
                    new_book.title, author_display
                )));
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub fn generate_csv_export(books: Vec<Book>) -> Result<String, AppError> {
    let mut writer = Writer::from_writer(vec![]);

    // Write header
    writer
        .write_record([
            "title",
            "author",
            "current_progress",
            "total_progress",
            "progress_type",
            "target_date",
            "completed_at",
        ])
        .map_err(|e| AppError::from(format!("Failed to write CSV header: {}", e)))?;

    // Write book records
    for book in books {
        writer
            .write_record([
                &book.title,
                &book.author.unwrap_or_default(),
                &book.current_progress.to_string(),
                &book.total_progress.to_string(),
                &book.progress_type,
                &book.target_date.unwrap_or_default(),
                &book.completed_at.unwrap_or_default(),
            ])
            .map_err(|e| AppError::from(format!("Failed to write CSV record: {}", e)))?;
    }

    let data = writer
        .into_inner()
        .map_err(|e| AppError::from(format!("Failed to finalize CSV: {}", e)))?;

    String::from_utf8(data).map_err(|e| AppError::from(format!("Failed to convert CSV to string: {}", e)))
}
