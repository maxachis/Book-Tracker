package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"github.com/maxachis/book-tracker/wails/migrations"

	_ "modernc.org/sqlite"
)

type Store struct {
	DB *sql.DB
}

// Open returns a Store backed by the given DSN. Pass ":memory:" for tests.
func Open(dsn string) (*Store, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite %s: %w", dsn, err)
	}
	if err := migrations.Run(db); err != nil {
		_ = db.Close()
		return nil, err
	}
	return &Store{DB: db}, nil
}

// DefaultDBPath returns the per-user location for the book-tracker DB file,
// creating the parent directory if it does not exist.
func DefaultDBPath() (string, error) {
	cfg, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("user config dir: %w", err)
	}
	dir := filepath.Join(cfg, "book-tracker")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", fmt.Errorf("mkdir %s: %w", dir, err)
	}
	return filepath.Join(dir, "book-tracker.db"), nil
}

func (s *Store) Close() error {
	return s.DB.Close()
}
