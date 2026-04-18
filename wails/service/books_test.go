package service

import (
	"strings"
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
)

func TestGenerateBookID_ReturnsUUIDv4(t *testing.T) {
	id := GenerateBookID()
	if len(id) != 36 {
		t.Fatalf("expected 36-char UUID, got %q (len=%d)", id, len(id))
	}
	if strings.Count(id, "-") != 4 {
		t.Fatalf("expected 4 hyphens in UUID, got %q", id)
	}
	// v4 marker: 15th char is '4'
	if id[14] != '4' {
		t.Fatalf("expected UUIDv4 (char[14]=='4'), got %q", id)
	}
}

func TestGenerateBookID_Unique(t *testing.T) {
	seen := make(map[string]struct{}, 1000)
	for i := 0; i < 1000; i++ {
		id := GenerateBookID()
		if _, dup := seen[id]; dup {
			t.Fatalf("duplicate id generated: %s", id)
		}
		seen[id] = struct{}{}
	}
}

func TestValidateCreateBookRequest(t *testing.T) {
	author := "A"
	tests := []struct {
		name    string
		req     model.CreateBookRequest
		wantErr string
	}{
		{
			name: "valid page",
			req:  model.CreateBookRequest{Title: "Book", Author: &author, TotalProgress: 300, ProgressType: "page"},
		},
		{
			name: "valid location",
			req:  model.CreateBookRequest{Title: "Book", TotalProgress: 9999, ProgressType: "location"},
		},
		{
			name: "valid percentage",
			req:  model.CreateBookRequest{Title: "Book", TotalProgress: 100, ProgressType: "percentage"},
		},
		{
			name:    "empty title",
			req:     model.CreateBookRequest{Title: "", TotalProgress: 100, ProgressType: "page"},
			wantErr: "title",
		},
		{
			name:    "whitespace title",
			req:     model.CreateBookRequest{Title: "   ", TotalProgress: 100, ProgressType: "page"},
			wantErr: "title",
		},
		{
			name:    "zero total",
			req:     model.CreateBookRequest{Title: "Book", TotalProgress: 0, ProgressType: "page"},
			wantErr: "total progress",
		},
		{
			name:    "negative total",
			req:     model.CreateBookRequest{Title: "Book", TotalProgress: -5, ProgressType: "page"},
			wantErr: "total progress",
		},
		{
			name:    "bad progress type",
			req:     model.CreateBookRequest{Title: "Book", TotalProgress: 100, ProgressType: "chapters"},
			wantErr: "progress type",
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateCreateBookRequest(tc.req)
			if tc.wantErr == "" {
				if err != nil {
					t.Fatalf("expected nil error, got %v", err)
				}
				return
			}
			if err == nil {
				t.Fatalf("expected error containing %q, got nil", tc.wantErr)
			}
			if !strings.Contains(strings.ToLower(err.Error()), tc.wantErr) {
				t.Fatalf("expected error to contain %q, got %q", tc.wantErr, err.Error())
			}
		})
	}
}
