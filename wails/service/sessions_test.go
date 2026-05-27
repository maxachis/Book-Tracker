package service

import (
	"testing"
	"time"

	"github.com/maxachis/book-tracker/wails/model"
)

func TestUpdateBook_RecordsReadingSession(t *testing.T) {
	svc := newTestService(t)
	b, err := svc.CreateBook(model.CreateBookRequest{Title: "Dune", TotalProgress: 500, ProgressType: "page"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	cur := 50
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &cur}); err != nil {
		t.Fatalf("update: %v", err)
	}

	today := time.Now().UTC().Format("2006-01-02")
	summary, err := svc.Store.GetDailyReadingSummary(today)
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if len(summary.Books) != 1 {
		t.Fatalf("want 1 book session, got %d", len(summary.Books))
	}
	if summary.Books[0].ProgressDelta != 50 {
		t.Fatalf("want delta=50, got %d", summary.Books[0].ProgressDelta)
	}
}

func TestUpdateBook_AccumulatesSessionOnSameDay(t *testing.T) {
	svc := newTestService(t)
	b, err := svc.CreateBook(model.CreateBookRequest{Title: "Dune", TotalProgress: 500, ProgressType: "page"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	first := 30
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &first}); err != nil {
		t.Fatalf("first update: %v", err)
	}
	second := 80
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &second}); err != nil {
		t.Fatalf("second update: %v", err)
	}

	today := time.Now().UTC().Format("2006-01-02")
	summary, err := svc.Store.GetDailyReadingSummary(today)
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if summary.Books[0].ProgressDelta != 80 {
		t.Fatalf("want accumulated delta=80 (30+50), got %d", summary.Books[0].ProgressDelta)
	}
}

func TestUpdateBook_NegativeDeltaNotRecorded(t *testing.T) {
	svc := newTestService(t)
	b, err := svc.CreateBook(model.CreateBookRequest{Title: "Dune", TotalProgress: 500, ProgressType: "page"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	// Set progress forward first
	fwd := 100
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &fwd}); err != nil {
		t.Fatalf("forward: %v", err)
	}
	// Now go backward (re-read, bookmark correction, etc.)
	back := 50
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &back}); err != nil {
		t.Fatalf("backward: %v", err)
	}

	today := time.Now().UTC().Format("2006-01-02")
	summary, err := svc.Store.GetDailyReadingSummary(today)
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	// Only the forward progress (100) should count
	if summary.Books[0].ProgressDelta != 100 {
		t.Fatalf("want delta=100 (negative delta ignored), got %d", summary.Books[0].ProgressDelta)
	}
}

func TestUpdateBook_NoSessionWhenProgressUnchanged(t *testing.T) {
	svc := newTestService(t)
	b, err := svc.CreateBook(model.CreateBookRequest{Title: "Dune", TotalProgress: 500, ProgressType: "page"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	// Update with same progress (delta = 0)
	zero := 0
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &zero}); err != nil {
		t.Fatalf("update: %v", err)
	}

	today := time.Now().UTC().Format("2006-01-02")
	summary, err := svc.Store.GetDailyReadingSummary(today)
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if len(summary.Books) != 0 {
		t.Fatalf("want no sessions for zero-delta update, got %d", len(summary.Books))
	}
}
