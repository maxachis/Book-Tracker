pub const MIGRATIONS: &[&str] = &[
    // Migration 1: Create books table
    r#"
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
    // Migration 2: Create user_settings table
    r#"
    CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        reading_start_hour INTEGER NOT NULL DEFAULT 8,
        reading_end_hour INTEGER NOT NULL DEFAULT 22,
        stats_start_date TEXT
    );
    "#,
    // Migration 3: Insert default settings if not exists
    r#"
    INSERT OR IGNORE INTO user_settings (id, reading_start_hour, reading_end_hour)
    VALUES (1, 8, 22);
    "#,
];
