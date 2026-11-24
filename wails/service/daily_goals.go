package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/maxachis/book-tracker/wails/model"
)

// dateLayout is the YYYY-MM-DD calendar-date format shared with the frontend.
const dateLayout = "2006-01-02"

// GetDailyGoals returns the goals saved for the given local date (YYYY-MM-DD).
func (s *Service) GetDailyGoals(date string) ([]model.DailyGoal, error) {
	if err := validateDate(date); err != nil {
		return nil, err
	}
	return s.Store.GetDailyGoals(date)
}

// SetDailyGoal validates and saves a book's goal for a local date.
func (s *Service) SetDailyGoal(goal model.DailyGoal) error {
	if goal.BookID == "" {
		return errors.New("daily goal: book id is required")
	}
	if err := validateDate(goal.Date); err != nil {
		return err
	}
	return s.Store.SetDailyGoal(goal)
}

func validateDate(date string) error {
	if _, err := time.Parse(dateLayout, date); err != nil {
		return fmt.Errorf("invalid date %q: want YYYY-MM-DD", date)
	}
	return nil
}
