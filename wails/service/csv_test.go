package service

import (
	"strings"
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
)

func ptr(s string) *string { return &s }

func TestParseCSVBooks_ValidRows(t *testing.T) {
	csv := "title,author,current_progress,total_progress,progress_type,target_date,completed_at\n" +
		"Dune,Frank Herbert,100,412,page,,\n" +
		"No Author,,0,300,page,2026-01-01,\n"

	got, err := ParseCSVBooks(csv)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("want 2 records, got %d", len(got))
	}
	if got[0].Title != "Dune" || got[0].Author == nil || *got[0].Author != "Frank Herbert" {
		t.Fatalf("row 0 wrong: %+v", got[0])
	}
	if got[0].CurrentProgress != 100 || got[0].TotalProgress != 412 {
		t.Fatalf("row 0 progress wrong: %+v", got[0])
	}
	if got[1].Author != nil {
		t.Fatalf("row 1 author should be nil (empty string), got %q", *got[1].Author)
	}
	if got[1].TargetDate == nil || *got[1].TargetDate != "2026-01-01" {
		t.Fatalf("row 1 target_date wrong: %+v", got[1].TargetDate)
	}
}

func TestParseCSVBooks_RejectsInvalidProgressType(t *testing.T) {
	csv := "title,author,current_progress,total_progress,progress_type,target_date,completed_at\n" +
		"Dune,Frank,10,100,chapters,,\n"
	_, err := ParseCSVBooks(csv)
	if err == nil || !strings.Contains(err.Error(), "chapters") {
		t.Fatalf("expected invalid progress type error, got %v", err)
	}
}

func TestParseCSVBooks_NonNumericProgress(t *testing.T) {
	csv := "title,author,current_progress,total_progress,progress_type,target_date,completed_at\n" +
		"Dune,Frank,abc,100,page,,\n"
	_, err := ParseCSVBooks(csv)
	if err == nil {
		t.Fatal("expected parse error for non-numeric progress")
	}
}

func TestGenerateCSVExport_HeaderAndRows(t *testing.T) {
	author := "Frank"
	target := "2026-06-01"
	books := []model.Book{
		{Title: "Dune", Author: &author, CurrentProgress: 100, TotalProgress: 412, ProgressType: "page", TargetDate: &target},
		{Title: "No Author", CurrentProgress: 0, TotalProgress: 300, ProgressType: "page"},
	}
	out, err := GenerateCSVExport(books)
	if err != nil {
		t.Fatalf("export: %v", err)
	}
	lines := strings.Split(strings.TrimRight(out, "\n"), "\n")
	if lines[0] != "title,author,current_progress,total_progress,progress_type,target_date,completed_at" {
		t.Fatalf("unexpected header: %q", lines[0])
	}
	if len(lines) != 3 {
		t.Fatalf("want 3 lines (header + 2 rows), got %d: %q", len(lines), out)
	}
	if !strings.HasPrefix(lines[1], "Dune,Frank,100,412,page,2026-06-01,") {
		t.Fatalf("unexpected row 1: %q", lines[1])
	}
	if !strings.HasPrefix(lines[2], "No Author,,0,300,page,,") {
		t.Fatalf("unexpected row 2: %q", lines[2])
	}
}

func TestCSVRoundTrip(t *testing.T) {
	author := "Frank"
	target := "2026-06-01"
	completed := "2026-05-01T12:00:00Z"
	books := []model.Book{
		{Title: "Dune", Author: &author, CurrentProgress: 412, TotalProgress: 412, ProgressType: "page", TargetDate: &target, CompletedAt: &completed},
		{Title: "Plain", CurrentProgress: 0, TotalProgress: 100, ProgressType: "percentage"},
	}
	out, err := GenerateCSVExport(books)
	if err != nil {
		t.Fatalf("export: %v", err)
	}
	recs, err := ParseCSVBooks(out)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if len(recs) != len(books) {
		t.Fatalf("len mismatch: %d vs %d", len(recs), len(books))
	}
	for i, b := range books {
		r := recs[i]
		if r.Title != b.Title || r.CurrentProgress != b.CurrentProgress || r.TotalProgress != b.TotalProgress || r.ProgressType != b.ProgressType {
			t.Fatalf("row %d core mismatch: %+v vs %+v", i, r, b)
		}
		if !strPtrEq(r.Author, b.Author) || !strPtrEq(r.TargetDate, b.TargetDate) || !strPtrEq(r.CompletedAt, b.CompletedAt) {
			t.Fatalf("row %d nullable mismatch: %+v vs %+v", i, r, b)
		}
	}
}

func strPtrEq(a, b *string) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return *a == *b
}

func TestCheckDuplicates_Flags(t *testing.T) {
	existingAuthor := "Frank Herbert"
	existing := []model.Book{
		{Title: "Dune", Author: &existingAuthor},
		{Title: "Anonymous"},
	}
	records := []model.CSVBookRecord{
		{Title: "dune", Author: ptr("frank herbert")},        // case-insensitive dup
		{Title: "Anonymous"},                                  // both-nil author dup
		{Title: "Foundation", Author: ptr("Isaac Asimov")},    // not a dup
		{Title: "Dune", Author: nil},                          // author differs => not dup
	}
	dups := CheckDuplicates(records, existing)
	if len(dups) != 2 {
		t.Fatalf("want 2 dups, got %d: %+v", len(dups), dups)
	}
	if dups[0].Title != "dune" || dups[1].Title != "Anonymous" {
		t.Fatalf("unexpected dup list: %+v", dups)
	}
}

func TestCheckDuplicates_EmptyInputs(t *testing.T) {
	if got := CheckDuplicates(nil, nil); len(got) != 0 {
		t.Fatalf("want empty, got %+v", got)
	}
}
