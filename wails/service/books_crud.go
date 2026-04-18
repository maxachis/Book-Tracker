package service

import (
	"errors"

	"github.com/maxachis/book-tracker/wails/model"
)

// CreateBook validates the request, generates an ID and created_at
// timestamp, then persists the new row.
func (s *Service) CreateBook(req model.CreateBookRequest) (model.Book, error) {
	if err := ValidateCreateBookRequest(req); err != nil {
		return model.Book{}, err
	}
	b := model.Book{
		ID:              GenerateBookID(),
		Title:           req.Title,
		Author:          req.Author,
		CurrentProgress: 0,
		TotalProgress:   req.TotalProgress,
		ProgressType:    req.ProgressType,
		TargetDate:      req.TargetDate,
		CompletedAt:     nil,
		CreatedAt:       nowRFC3339(),
	}
	if err := s.Store.InsertBook(b); err != nil {
		return model.Book{}, err
	}
	return b, nil
}

// UpdateBook reads the existing row, merges nilable fields from the
// request, validates progress, and recomputes completed_at before
// persisting.
func (s *Service) UpdateBook(req model.UpdateBookRequest) (model.Book, error) {
	existing, err := s.Store.GetBook(req.ID)
	if err != nil {
		return model.Book{}, err
	}

	if req.Title != nil {
		existing.Title = *req.Title
	}
	if req.Author != nil {
		existing.Author = req.Author
	}
	if req.CurrentProgress != nil {
		existing.CurrentProgress = *req.CurrentProgress
	}
	if req.TotalProgress != nil {
		existing.TotalProgress = *req.TotalProgress
	}
	if req.ProgressType != nil {
		existing.ProgressType = *req.ProgressType
	}
	if req.TargetDate != nil {
		existing.TargetDate = req.TargetDate
	}

	if err := ValidateProgressUpdate(existing.CurrentProgress, existing.TotalProgress); err != nil {
		return model.Book{}, err
	}

	switch {
	case existing.CurrentProgress >= existing.TotalProgress && existing.CompletedAt == nil:
		ts := nowRFC3339()
		existing.CompletedAt = &ts
	case existing.CurrentProgress < existing.TotalProgress:
		existing.CompletedAt = nil
	}

	if err := s.Store.UpdateBook(existing); err != nil {
		return model.Book{}, err
	}
	return existing, nil
}

// MarkBookComplete sets current_progress to total_progress and stamps
// completed_at with the current time.
func (s *Service) MarkBookComplete(id string) (model.Book, error) {
	b, err := s.Store.GetBook(id)
	if err != nil {
		return model.Book{}, err
	}
	b.CurrentProgress = b.TotalProgress
	ts := nowRFC3339()
	b.CompletedAt = &ts
	if err := s.Store.UpdateBook(b); err != nil {
		return model.Book{}, err
	}
	return b, nil
}

// ValidateProgressUpdate mirrors the Rust validate_progress_update:
// progress must be non-negative and not exceed total.
func ValidateProgressUpdate(current, total int) error {
	if current < 0 {
		return errors.New("progress cannot be negative")
	}
	if current > total {
		return errors.New("progress cannot exceed total")
	}
	return nil
}
