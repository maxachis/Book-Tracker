package store

import (
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func TestOpen_InMemory_AppliesSchema(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	var n int
	if err := s.DB.QueryRow(`SELECT count(*) FROM user_settings WHERE id = 1`).Scan(&n); err != nil {
		t.Fatalf("query settings: %v", err)
	}
	if n != 1 {
		t.Fatalf("expected seeded settings row, got count=%d", n)
	}
}

func TestOpen_FileBacked_PersistsAcrossReopen(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "book-tracker.db")

	s1, err := Open(path)
	if err != nil {
		t.Fatalf("open 1: %v", err)
	}
	if _, err := s1.DB.Exec(`INSERT INTO books (id, title, total_progress, progress_type, created_at) VALUES (?, ?, ?, ?, ?)`,
		"b1", "Test", 100, "page", "2026-04-15"); err != nil {
		t.Fatalf("insert: %v", err)
	}
	s1.Close()

	s2, err := Open(path)
	if err != nil {
		t.Fatalf("open 2: %v", err)
	}
	defer s2.Close()
	var title string
	if err := s2.DB.QueryRow(`SELECT title FROM books WHERE id = ?`, "b1").Scan(&title); err != nil {
		t.Fatalf("query: %v", err)
	}
	if title != "Test" {
		t.Fatalf("want Test, got %q", title)
	}
}
