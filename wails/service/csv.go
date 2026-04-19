package service

import (
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/maxachis/book-tracker/wails/model"
)

var csvHeader = []string{
	"title",
	"author",
	"current_progress",
	"total_progress",
	"progress_type",
	"target_date",
	"completed_at",
}

// ParseCSVBooks parses a CSV document into CSVBookRecord values, preserving
// the column order defined by csvHeader. Empty string cells for author,
// target_date, and completed_at round-trip as nil.
func ParseCSVBooks(content string) ([]model.CSVBookRecord, error) {
	r := csv.NewReader(strings.NewReader(content))
	header, err := r.Read()
	if err == io.EOF {
		return []model.CSVBookRecord{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read header: %w", err)
	}
	idx, err := headerIndex(header)
	if err != nil {
		return nil, err
	}

	out := []model.CSVBookRecord{}
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("read row: %w", err)
		}

		rec := model.CSVBookRecord{
			Title:        row[idx["title"]],
			Author:       optionalStr(row[idx["author"]]),
			ProgressType: row[idx["progress_type"]],
			TargetDate:   optionalStr(row[idx["target_date"]]),
			CompletedAt:  optionalStr(row[idx["completed_at"]]),
		}
		if rec.CurrentProgress, err = strconv.Atoi(row[idx["current_progress"]]); err != nil {
			return nil, fmt.Errorf("row %q: current_progress: %w", rec.Title, err)
		}
		if rec.TotalProgress, err = strconv.Atoi(row[idx["total_progress"]]); err != nil {
			return nil, fmt.Errorf("row %q: total_progress: %w", rec.Title, err)
		}
		switch rec.ProgressType {
		case "page", "location", "percentage":
		default:
			return nil, fmt.Errorf("invalid progress type %q for book %q", rec.ProgressType, rec.Title)
		}
		out = append(out, rec)
	}
	return out, nil
}

// GenerateCSVExport serializes books in csvHeader order.
func GenerateCSVExport(books []model.Book) (string, error) {
	var buf strings.Builder
	w := csv.NewWriter(&buf)
	if err := w.Write(csvHeader); err != nil {
		return "", fmt.Errorf("write header: %w", err)
	}
	for _, b := range books {
		row := []string{
			b.Title,
			derefStr(b.Author),
			strconv.Itoa(b.CurrentProgress),
			strconv.Itoa(b.TotalProgress),
			b.ProgressType,
			derefStr(b.TargetDate),
			derefStr(b.CompletedAt),
		}
		if err := w.Write(row); err != nil {
			return "", fmt.Errorf("write row %q: %w", b.Title, err)
		}
	}
	w.Flush()
	if err := w.Error(); err != nil {
		return "", fmt.Errorf("flush: %w", err)
	}
	return buf.String(), nil
}

// CheckDuplicates returns CSV rows whose (title, author) collides with an
// existing book. Comparison is case-insensitive on title and author; both
// authors nil counts as a match.
func CheckDuplicates(records []model.CSVBookRecord, existing []model.Book) []model.DuplicateReport {
	out := []model.DuplicateReport{}
	for _, rec := range records {
		for _, b := range existing {
			if !strings.EqualFold(rec.Title, b.Title) {
				continue
			}
			if !authorsMatch(rec.Author, b.Author) {
				continue
			}
			out = append(out, model.DuplicateReport{Title: rec.Title, Author: rec.Author})
			break
		}
	}
	return out
}

func authorsMatch(a, b *string) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return strings.EqualFold(*a, *b)
}

func optionalStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func headerIndex(header []string) (map[string]int, error) {
	idx := make(map[string]int, len(header))
	for i, h := range header {
		idx[strings.TrimSpace(h)] = i
	}
	for _, want := range csvHeader {
		if _, ok := idx[want]; !ok {
			return nil, fmt.Errorf("missing CSV column %q", want)
		}
	}
	return idx, nil
}
