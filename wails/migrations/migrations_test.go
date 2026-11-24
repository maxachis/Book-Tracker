package migrations

import (
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/maxachis/book-tracker/wails/model"

	_ "modernc.org/sqlite"
)

// preLocationStepSettingsDDL is the user_settings table as shipped before the
// location_step setting existed.
const preLocationStepSettingsDDL = `
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    reading_start_hour INTEGER NOT NULL DEFAULT 8,
    reading_end_hour INTEGER NOT NULL DEFAULT 22,
    stats_start_date TEXT
);
INSERT INTO user_settings (id, reading_start_hour, reading_end_hour) VALUES (1, 6, 20);`

func openLegacyDB(t *testing.T, dsn string) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	// ":memory:" gives every pooled connection its own database.
	db.SetMaxOpenConns(1)
	t.Cleanup(func() { _ = db.Close() })
	if _, err := db.Exec(preLocationStepSettingsDDL); err != nil {
		t.Fatalf("seed legacy schema: %v", err)
	}
	return db
}

func TestRun_AddsLocationStepToLegacySettings(t *testing.T) {
	// Existing users' databases predate the location_step column, and
	// CREATE TABLE IF NOT EXISTS will not add it, so Run must.
	dsns := map[string]string{
		"memory":      ":memory:",
		"file-backed": filepath.Join(t.TempDir(), "legacy.db"),
	}
	for name, dsn := range dsns {
		t.Run(name, func(t *testing.T) {
			db := openLegacyDB(t, dsn)

			if err := Run(db); err != nil {
				t.Fatalf("first run: %v", err)
			}
			if err := Run(db); err != nil {
				t.Fatalf("second run must be a no-op: %v", err)
			}

			var step, start int
			err := db.QueryRow(`SELECT location_step, reading_start_hour FROM user_settings WHERE id = 1`).Scan(&step, &start)
			if err != nil {
				t.Fatalf("query: %v", err)
			}
			if step != model.DefaultLocationStep {
				t.Fatalf("existing row should get default location_step, got %d", step)
			}
			if start != 6 {
				t.Fatalf("existing settings must be preserved, got start hour %d", start)
			}
		})
	}
}
