package store

import (
	"path/filepath"
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
)

func newBook(id, title string) model.Book {
	author := "Author"
	return model.Book{
		ID:              id,
		Title:           title,
		Author:          &author,
		CurrentProgress: 0,
		TotalProgress:   100,
		ProgressType:    "page",
		CreatedAt:       "2026-04-15T00:00:00Z",
	}
}

func TestInsertBook_AndGetBook(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	b := newBook("b1", "Hello")
	if err := s.InsertBook(b); err != nil {
		t.Fatalf("insert: %v", err)
	}

	got, err := s.GetBook("b1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Title != "Hello" || got.TotalProgress != 100 || got.ProgressType != "page" {
		t.Fatalf("unexpected book: %+v", got)
	}
	if got.Author == nil || *got.Author != "Author" {
		t.Fatalf("author mismatch: %+v", got.Author)
	}
	if got.CompletedAt != nil {
		t.Fatalf("expected nil completed_at, got %v", *got.CompletedAt)
	}
}

func TestGetBook_NotFound(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()
	if _, err := s.GetBook("missing"); err == nil {
		t.Fatal("expected error for missing book")
	}
}

func TestListActiveBooks_FiltersCompleted(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	a := newBook("a", "Active")
	a.CreatedAt = "2026-04-10T00:00:00Z"
	c := newBook("c", "Done")
	c.CreatedAt = "2026-04-11T00:00:00Z"
	done := "2026-04-12T00:00:00Z"
	c.CompletedAt = &done
	c.CurrentProgress = 100

	if err := s.InsertBook(a); err != nil {
		t.Fatalf("insert a: %v", err)
	}
	if err := s.InsertBook(c); err != nil {
		t.Fatalf("insert c: %v", err)
	}

	active, err := s.ListActiveBooks()
	if err != nil {
		t.Fatalf("list active: %v", err)
	}
	if len(active) != 1 || active[0].ID != "a" {
		t.Fatalf("expected 1 active book [a], got %+v", active)
	}

	completed, err := s.ListCompletedBooks()
	if err != nil {
		t.Fatalf("list completed: %v", err)
	}
	if len(completed) != 1 || completed[0].ID != "c" {
		t.Fatalf("expected 1 completed book [c], got %+v", completed)
	}

	all, err := s.ListAllBooks()
	if err != nil {
		t.Fatalf("list all: %v", err)
	}
	if len(all) != 2 {
		t.Fatalf("expected 2 books, got %d", len(all))
	}
}

func TestListActiveBooks_OrderedByCreatedDesc(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	b1 := newBook("old", "Old")
	b1.CreatedAt = "2026-01-01T00:00:00Z"
	b2 := newBook("new", "New")
	b2.CreatedAt = "2026-04-01T00:00:00Z"

	for _, b := range []model.Book{b1, b2} {
		if err := s.InsertBook(b); err != nil {
			t.Fatalf("insert: %v", err)
		}
	}

	got, err := s.ListActiveBooks()
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(got) != 2 || got[0].ID != "new" || got[1].ID != "old" {
		t.Fatalf("wrong order: %+v", got)
	}
}

func TestUpdateBook_PersistsFields(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	b := newBook("u1", "Before")
	if err := s.InsertBook(b); err != nil {
		t.Fatalf("insert: %v", err)
	}

	b.Title = "After"
	b.CurrentProgress = 50
	done := "2026-04-15T12:00:00Z"
	b.CompletedAt = &done
	if err := s.UpdateBook(b); err != nil {
		t.Fatalf("update: %v", err)
	}

	got, err := s.GetBook("u1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Title != "After" || got.CurrentProgress != 50 {
		t.Fatalf("update did not persist: %+v", got)
	}
	if got.CompletedAt == nil || *got.CompletedAt != done {
		t.Fatalf("completed_at mismatch: %+v", got.CompletedAt)
	}
}

func TestUpdateBook_ClearsCompletedAt(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	b := newBook("u2", "B")
	done := "2026-04-15T00:00:00Z"
	b.CompletedAt = &done
	b.CurrentProgress = 100
	if err := s.InsertBook(b); err != nil {
		t.Fatalf("insert: %v", err)
	}

	b.CompletedAt = nil
	b.CurrentProgress = 50
	if err := s.UpdateBook(b); err != nil {
		t.Fatalf("update: %v", err)
	}
	got, err := s.GetBook("u2")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.CompletedAt != nil {
		t.Fatalf("expected cleared completed_at, got %v", *got.CompletedAt)
	}
}

func TestDeleteBook(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	b := newBook("d1", "Doomed")
	if err := s.InsertBook(b); err != nil {
		t.Fatalf("insert: %v", err)
	}
	if err := s.DeleteBook("d1"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, err := s.GetBook("d1"); err == nil {
		t.Fatal("expected not-found after delete")
	}
}

func TestBooksCRUD_FileBacked(t *testing.T) {
	dir := t.TempDir()
	s, err := Open(filepath.Join(dir, "file.db"))
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	b := newBook("f1", "File")
	if err := s.InsertBook(b); err != nil {
		t.Fatalf("insert: %v", err)
	}
	list, err := s.ListAllBooks()
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 1 || list[0].ID != "f1" {
		t.Fatalf("list mismatch: %+v", list)
	}
}
