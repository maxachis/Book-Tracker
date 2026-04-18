package service

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/maxachis/book-tracker/wails/model"
)

// GenerateBookID returns a fresh RFC 4122 v4 UUID for use as a book primary key.
func GenerateBookID() string {
	return uuid.NewString()
}

// ValidateCreateBookRequest mirrors the Rust validate_book_request check:
// non-empty title, positive total_progress, and a recognised progress_type.
func ValidateCreateBookRequest(r model.CreateBookRequest) error {
	if strings.TrimSpace(r.Title) == "" {
		return errors.New("title cannot be empty")
	}
	if r.TotalProgress <= 0 {
		return errors.New("total progress must be greater than 0")
	}
	switch r.ProgressType {
	case string(model.ProgressPage), string(model.ProgressLocation), string(model.ProgressPercentage):
		return nil
	default:
		return errors.New("progress type must be 'page', 'location', or 'percentage'")
	}
}
