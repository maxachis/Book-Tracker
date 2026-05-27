package store

import (
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
)

func insertTestBook(t *testing.T, s *Store, id string) {
	t.Helper()
	if err := s.InsertBook(model.Book{
		ID:            id,
		Title:         "Test Book",
		TotalProgress: 300,
		ProgressType:  "page",
		CreatedAt:     "2026-01-01T00:00:00Z",
	}); err != nil {
		t.Fatalf("insert book: %v", err)
	}
}

func TestUpsertReadingSession_InsertsNew(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	insertTestBook(t, s, "b1")

	if err := s.UpsertReadingSession("b1", "2026-05-26", 42); err != nil {
		t.Fatalf("upsert: %v", err)
	}

	summary, err := s.GetDailyReadingSummary("2026-05-26")
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if len(summary.Books) != 1 {
		t.Fatalf("want 1 book, got %d", len(summary.Books))
	}
	if summary.Books[0].ProgressDelta != 42 {
		t.Fatalf("want delta=42, got %d", summary.Books[0].ProgressDelta)
	}
}

func TestUpsertReadingSession_AccumulatesOnSameDay(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	insertTestBook(t, s, "b1")

	if err := s.UpsertReadingSession("b1", "2026-05-26", 10); err != nil {
		t.Fatalf("first upsert: %v", err)
	}
	if err := s.UpsertReadingSession("b1", "2026-05-26", 15); err != nil {
		t.Fatalf("second upsert: %v", err)
	}

	summary, err := s.GetDailyReadingSummary("2026-05-26")
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if summary.Books[0].ProgressDelta != 25 {
		t.Fatalf("want delta=25, got %d", summary.Books[0].ProgressDelta)
	}
}

func TestUpsertReadingSession_SeparateDaysAreIndependent(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	insertTestBook(t, s, "b1")

	if err := s.UpsertReadingSession("b1", "2026-05-25", 20); err != nil {
		t.Fatalf("day1: %v", err)
	}
	if err := s.UpsertReadingSession("b1", "2026-05-26", 30); err != nil {
		t.Fatalf("day2: %v", err)
	}

	day1, err := s.GetDailyReadingSummary("2026-05-25")
	if err != nil {
		t.Fatalf("day1 summary: %v", err)
	}
	day2, err := s.GetDailyReadingSummary("2026-05-26")
	if err != nil {
		t.Fatalf("day2 summary: %v", err)
	}
	if day1.Books[0].ProgressDelta != 20 {
		t.Fatalf("day1 want 20, got %d", day1.Books[0].ProgressDelta)
	}
	if day2.Books[0].ProgressDelta != 30 {
		t.Fatalf("day2 want 30, got %d", day2.Books[0].ProgressDelta)
	}
}

func TestGetDailyReadingSummary_EmptyDay(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	summary, err := s.GetDailyReadingSummary("2026-05-26")
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if len(summary.Books) != 0 {
		t.Fatalf("want empty, got %d books", len(summary.Books))
	}
	if summary.Date != "2026-05-26" {
		t.Fatalf("want date=2026-05-26, got %q", summary.Date)
	}
}

func TestGetDailyReadingSummary_IncludesBookTitle(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	if err := s.InsertBook(model.Book{
		ID:            "b1",
		Title:         "Dune",
		TotalProgress: 500,
		ProgressType:  "page",
		CreatedAt:     "2026-01-01T00:00:00Z",
	}); err != nil {
		t.Fatalf("insert: %v", err)
	}

	if err := s.UpsertReadingSession("b1", "2026-05-26", 50); err != nil {
		t.Fatalf("upsert: %v", err)
	}

	summary, err := s.GetDailyReadingSummary("2026-05-26")
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if summary.Books[0].Title != "Dune" {
		t.Fatalf("want title=Dune, got %q", summary.Books[0].Title)
	}
	if summary.Books[0].ProgressType != "page" {
		t.Fatalf("want progress_type=page, got %q", summary.Books[0].ProgressType)
	}
}

func TestGetDailyReadingSummary_MultipleBooks(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	insertTestBook(t, s, "b1")
	if err := s.InsertBook(model.Book{
		ID: "b2", Title: "Other", TotalProgress: 200, ProgressType: "location", CreatedAt: "2026-01-01T00:00:00Z",
	}); err != nil {
		t.Fatalf("insert b2: %v", err)
	}

	if err := s.UpsertReadingSession("b1", "2026-05-26", 10); err != nil {
		t.Fatalf("b1 upsert: %v", err)
	}
	if err := s.UpsertReadingSession("b2", "2026-05-26", 20); err != nil {
		t.Fatalf("b2 upsert: %v", err)
	}

	summary, err := s.GetDailyReadingSummary("2026-05-26")
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if len(summary.Books) != 2 {
		t.Fatalf("want 2 books, got %d", len(summary.Books))
	}
}

func TestUpsertReadingSession_FileBacked(t *testing.T) {
	s, err := Open(t.TempDir() + "/test.db")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	insertTestBook(t, s, "b1")
	if err := s.UpsertReadingSession("b1", "2026-05-26", 99); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	summary, err := s.GetDailyReadingSummary("2026-05-26")
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if summary.Books[0].ProgressDelta != 99 {
		t.Fatalf("want 99, got %d", summary.Books[0].ProgressDelta)
	}
}
