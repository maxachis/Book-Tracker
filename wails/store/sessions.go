package store

import (
	"fmt"

	"github.com/maxachis/book-tracker/wails/model"
)

// UpsertReadingSession adds delta to the reading_sessions row for (bookID, date),
// creating the row if it doesn't exist yet.
func (s *Store) UpsertReadingSession(bookID, date string, delta int) error {
	_, err := s.DB.Exec(`
		INSERT INTO reading_sessions (book_id, date, progress_delta)
		VALUES (?, ?, ?)
		ON CONFLICT(book_id, date) DO UPDATE SET progress_delta = progress_delta + excluded.progress_delta`,
		bookID, date, delta,
	)
	if err != nil {
		return fmt.Errorf("upsert reading session book=%s date=%s: %w", bookID, date, err)
	}
	return nil
}

// GetDailyReadingSummary returns all book sessions for the given date, joined
// with book metadata for display.
func (s *Store) GetDailyReadingSummary(date string) (model.DailyReadingSummary, error) {
	rows, err := s.DB.Query(`
		SELECT rs.book_id, b.title, rs.progress_delta, b.progress_type
		FROM reading_sessions rs
		JOIN books b ON b.id = rs.book_id
		WHERE rs.date = ?
		ORDER BY rs.progress_delta DESC`,
		date,
	)
	if err != nil {
		return model.DailyReadingSummary{}, fmt.Errorf("query daily summary %s: %w", date, err)
	}
	defer rows.Close()

	out := model.DailyReadingSummary{Date: date, Books: []model.BookSessionSummary{}}
	for rows.Next() {
		var b model.BookSessionSummary
		if err := rows.Scan(&b.BookID, &b.Title, &b.ProgressDelta, &b.ProgressType); err != nil {
			return model.DailyReadingSummary{}, fmt.Errorf("scan session row: %w", err)
		}
		out.Books = append(out.Books, b)
	}
	if err := rows.Err(); err != nil {
		return model.DailyReadingSummary{}, fmt.Errorf("iterate sessions: %w", err)
	}
	return out, nil
}
