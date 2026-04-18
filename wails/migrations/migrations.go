package migrations

import (
	_ "embed"
	"database/sql"
	"fmt"
)

//go:embed schema.sql
var schema string

// Run applies the embedded schema. SQLite DDL here is idempotent,
// so it's safe to invoke on every startup.
func Run(db *sql.DB) error {
	if _, err := db.Exec(schema); err != nil {
		return fmt.Errorf("apply schema: %w", err)
	}
	return nil
}
