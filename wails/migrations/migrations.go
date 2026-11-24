package migrations

import (
	"database/sql"
	_ "embed"
	"fmt"

	"github.com/maxachis/book-tracker/wails/model"
)

//go:embed schema.sql
var schema string

// Run applies the embedded schema, then adds any columns introduced after
// the original tables shipped. Every step is idempotent, so it's safe to
// invoke on every startup.
func Run(db *sql.DB) error {
	if _, err := db.Exec(schema); err != nil {
		return fmt.Errorf("apply schema: %w", err)
	}
	if err := addColumnIfMissing(db, "user_settings", "location_step",
		fmt.Sprintf("INTEGER NOT NULL DEFAULT %d", model.DefaultLocationStep)); err != nil {
		return err
	}
	return nil
}

// addColumnIfMissing adds a column to an existing table unless it is already
// there. SQLite has no ADD COLUMN IF NOT EXISTS, and databases created by
// earlier releases already have the table, so the CREATE TABLE in the schema
// cannot introduce new columns.
func addColumnIfMissing(db *sql.DB, table, column, definition string) error {
	exists, err := columnExists(db, table, column)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	if _, err := db.Exec(fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", table, column, definition)); err != nil {
		return fmt.Errorf("add column %s.%s: %w", table, column, err)
	}
	return nil
}

func columnExists(db *sql.DB, table, column string) (bool, error) {
	rows, err := db.Query(fmt.Sprintf("PRAGMA table_info(%s)", table))
	if err != nil {
		return false, fmt.Errorf("inspect table %s: %w", table, err)
	}
	defer rows.Close()
	for rows.Next() {
		var (
			cid        int
			name, typ  string
			notNull    int
			defaultVal sql.NullString
			pk         int
		)
		if err := rows.Scan(&cid, &name, &typ, &notNull, &defaultVal, &pk); err != nil {
			return false, fmt.Errorf("scan table_info %s: %w", table, err)
		}
		if name == column {
			return true, nil
		}
	}
	if err := rows.Err(); err != nil {
		return false, fmt.Errorf("inspect table %s: %w", table, err)
	}
	return false, nil
}
