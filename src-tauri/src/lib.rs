pub mod commands;
pub mod db;
pub mod error;
pub mod models;

use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "Create books table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS books (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    author TEXT,
                    current_progress INTEGER NOT NULL DEFAULT 0,
                    total_progress INTEGER NOT NULL,
                    progress_type TEXT NOT NULL CHECK(progress_type IN ('page', 'location', 'percentage')),
                    target_date TEXT,
                    completed_at TEXT,
                    created_at TEXT NOT NULL
                );
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "Create user_settings table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS user_settings (
                    id INTEGER PRIMARY KEY CHECK(id = 1),
                    reading_start_hour INTEGER NOT NULL DEFAULT 8,
                    reading_end_hour INTEGER NOT NULL DEFAULT 22,
                    stats_start_date TEXT
                );
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "Insert default settings",
            sql: r#"
                INSERT OR IGNORE INTO user_settings (id, reading_start_hour, reading_end_hour)
                VALUES (1, 8, 22);
            "#,
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:book-tracker.db", get_migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::generate_book_id,
            commands::get_current_timestamp,
            commands::validate_book_request,
            commands::validate_progress_update,
            commands::validate_settings,
            commands::parse_csv_books,
            commands::check_duplicates,
            commands::generate_csv_export,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
