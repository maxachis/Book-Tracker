package store

import (
	"fmt"

	"github.com/maxachis/book-tracker/wails/model"
)

// GetDailyGoals returns every book's goal saved for the given local date. It
// returns an empty (non-nil) slice when none exist.
func (s *Store) GetDailyGoals(date string) ([]model.DailyGoal, error) {
	rows, err := s.DB.Query(
		`SELECT book_id, date, start_progress, end_progress
		 FROM daily_goals WHERE date = ? ORDER BY book_id ASC`, date)
	if err != nil {
		return nil, fmt.Errorf("query daily goals %s: %w", date, err)
	}
	defer rows.Close()
	goals := []model.DailyGoal{}
	for rows.Next() {
		var g model.DailyGoal
		if err := rows.Scan(&g.BookID, &g.Date, &g.Start, &g.End); err != nil {
			return nil, fmt.Errorf("scan daily goal: %w", err)
		}
		goals = append(goals, g)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate daily goals: %w", err)
	}
	return goals, nil
}

// SetDailyGoal saves the goal for its (book, date), replacing any earlier one.
func (s *Store) SetDailyGoal(goal model.DailyGoal) error {
	_, err := s.DB.Exec(
		`INSERT INTO daily_goals (book_id, date, start_progress, end_progress)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(book_id, date) DO UPDATE SET
		   start_progress = excluded.start_progress,
		   end_progress = excluded.end_progress`,
		goal.BookID, goal.Date, goal.Start, goal.End)
	if err != nil {
		return fmt.Errorf("save daily goal %s %s: %w", goal.BookID, goal.Date, err)
	}
	return nil
}
