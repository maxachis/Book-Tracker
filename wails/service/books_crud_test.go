package service

import (
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
)

func TestCreateBook_PopulatesDefaults(t *testing.T) {
	svc := newTestService(t)
	author := "Ursula"
	b, err := svc.CreateBook(model.CreateBookRequest{
		Title:         "A Wizard of Earthsea",
		Author:        &author,
		TotalProgress: 200,
		ProgressType:  "page",
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if b.ID == "" || len(b.ID) != 36 {
		t.Fatalf("expected UUID id, got %q", b.ID)
	}
	if b.CurrentProgress != 0 {
		t.Fatalf("expected current_progress=0, got %d", b.CurrentProgress)
	}
	if b.CompletedAt != nil {
		t.Fatalf("expected nil completed_at, got %v", *b.CompletedAt)
	}
	if b.CreatedAt == "" {
		t.Fatal("expected created_at to be set")
	}

	got, err := svc.Store.GetBook(b.ID)
	if err != nil {
		t.Fatalf("persisted: %v", err)
	}
	if got.Title != b.Title {
		t.Fatalf("mismatch: %+v vs %+v", got, b)
	}
}

func TestCreateBook_RejectsInvalid(t *testing.T) {
	svc := newTestService(t)
	_, err := svc.CreateBook(model.CreateBookRequest{Title: "", TotalProgress: 10, ProgressType: "page"})
	if err == nil {
		t.Fatal("expected validation error")
	}
}

func TestUpdateBook_MergesAndTriggersCompletion(t *testing.T) {
	svc := newTestService(t)
	author := "Foo"
	b, err := svc.CreateBook(model.CreateBookRequest{Title: "T", Author: &author, TotalProgress: 100, ProgressType: "page"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	cur := 100
	updated, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &cur})
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.CompletedAt == nil {
		t.Fatal("expected completed_at to be set when current reaches total")
	}
	if updated.Title != "T" {
		t.Fatalf("expected title preserved, got %q", updated.Title)
	}
	if updated.Author == nil || *updated.Author != "Foo" {
		t.Fatalf("author not preserved: %+v", updated.Author)
	}
}

func TestUpdateBook_ClearsCompletionWhenProgressDrops(t *testing.T) {
	svc := newTestService(t)
	b, err := svc.CreateBook(model.CreateBookRequest{Title: "T", TotalProgress: 100, ProgressType: "page"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	full := 100
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &full}); err != nil {
		t.Fatalf("complete: %v", err)
	}
	less := 50
	reopened, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &less})
	if err != nil {
		t.Fatalf("reopen: %v", err)
	}
	if reopened.CompletedAt != nil {
		t.Fatalf("expected completed_at cleared, got %v", *reopened.CompletedAt)
	}
}

func TestUpdateBook_RejectsInvalidProgress(t *testing.T) {
	svc := newTestService(t)
	b, err := svc.CreateBook(model.CreateBookRequest{Title: "T", TotalProgress: 100, ProgressType: "page"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	neg := -1
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &neg}); err == nil {
		t.Fatal("expected error for negative progress")
	}
	over := 200
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: b.ID, CurrentProgress: &over}); err == nil {
		t.Fatal("expected error when current > total")
	}
}

func TestUpdateBook_NotFound(t *testing.T) {
	svc := newTestService(t)
	cur := 10
	if _, err := svc.UpdateBook(model.UpdateBookRequest{ID: "missing", CurrentProgress: &cur}); err == nil {
		t.Fatal("expected not-found error")
	}
}

func TestMarkBookComplete(t *testing.T) {
	svc := newTestService(t)
	b, err := svc.CreateBook(model.CreateBookRequest{Title: "T", TotalProgress: 250, ProgressType: "page"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	done, err := svc.MarkBookComplete(b.ID)
	if err != nil {
		t.Fatalf("mark: %v", err)
	}
	if done.CurrentProgress != 250 {
		t.Fatalf("expected progress=250, got %d", done.CurrentProgress)
	}
	if done.CompletedAt == nil {
		t.Fatal("expected completed_at set")
	}
}
