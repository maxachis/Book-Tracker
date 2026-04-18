package store

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/maxachis/book-tracker/wails/model"
)

// GetSettings returns the singleton user_settings row (id=1). Returns
// ErrNotFound if the seed row is absent — callers should fall back to
// defaults.
func (s *Store) GetSettings() (model.UserSettings, error) {
	var us model.UserSettings
	err := s.DB.QueryRow(
		`SELECT id, reading_start_hour, reading_end_hour, stats_start_date FROM user_settings WHERE id = 1`,
	).Scan(&us.ID, &us.ReadingStartHour, &us.ReadingEndHour, &us.StatsStartDate)
	if errors.Is(err, sql.ErrNoRows) {
		return model.UserSettings{}, ErrNotFound
	}
	if err != nil {
		return model.UserSettings{}, fmt.Errorf("get settings: %w", err)
	}
	return us, nil
}

func (s *Store) UpdateSettings(us model.UserSettings) error {
	_, err := s.DB.Exec(
		`UPDATE user_settings SET reading_start_hour = ?, reading_end_hour = ?, stats_start_date = ? WHERE id = 1`,
		us.ReadingStartHour, us.ReadingEndHour, us.StatsStartDate,
	)
	if err != nil {
		return fmt.Errorf("update settings: %w", err)
	}
	return nil
}
