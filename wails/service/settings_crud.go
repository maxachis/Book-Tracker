package service

import (
	"errors"

	"github.com/maxachis/book-tracker/wails/model"
	"github.com/maxachis/book-tracker/wails/store"
)

// GetSettings returns the stored user_settings row, falling back to
// hard-coded defaults if the row is missing.
func (s *Service) GetSettings() (model.UserSettings, error) {
	us, err := s.Store.GetSettings()
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return model.DefaultSettings(), nil
		}
		return model.UserSettings{}, err
	}
	return us, nil
}

// UpdateSettings validates the request, merges nilable fields over the
// current (or default) settings, then persists.
func (s *Service) UpdateSettings(req model.UpdateSettingsRequest) (model.UserSettings, error) {
	if err := ValidateSettings(req); err != nil {
		return model.UserSettings{}, err
	}
	cur, err := s.GetSettings()
	if err != nil {
		return model.UserSettings{}, err
	}
	if req.ReadingStartHour != nil {
		cur.ReadingStartHour = *req.ReadingStartHour
	}
	if req.ReadingEndHour != nil {
		cur.ReadingEndHour = *req.ReadingEndHour
	}
	if req.StatsStartDate != nil {
		cur.StatsStartDate = req.StatsStartDate
	}
	if err := s.Store.UpdateSettings(cur); err != nil {
		return model.UserSettings{}, err
	}
	return cur, nil
}

// ValidateSettings mirrors the Rust validate_settings: each hour must
// be in [0,23]; if both are supplied, start must be strictly less than
// end.
func ValidateSettings(req model.UpdateSettingsRequest) error {
	if req.ReadingStartHour != nil {
		if *req.ReadingStartHour < 0 || *req.ReadingStartHour > 23 {
			return errors.New("reading start hour must be between 0 and 23")
		}
	}
	if req.ReadingEndHour != nil {
		if *req.ReadingEndHour < 0 || *req.ReadingEndHour > 23 {
			return errors.New("reading end hour must be between 0 and 23")
		}
	}
	if req.ReadingStartHour != nil && req.ReadingEndHour != nil {
		if *req.ReadingStartHour >= *req.ReadingEndHour {
			return errors.New("reading start hour must be less than end hour")
		}
	}
	return nil
}
