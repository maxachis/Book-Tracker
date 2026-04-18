package store

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/maxachis/book-tracker/wails/model"
)

// ErrNotFound is returned when a row lookup produces no results.
var ErrNotFound = errors.New("not found")

const bookColumns = `id, title, author, current_progress, total_progress, progress_type, target_date, completed_at, created_at`

func (s *Store) InsertBook(b model.Book) error {
	_, err := s.DB.Exec(
		`INSERT INTO books (`+bookColumns+`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		b.ID, b.Title, b.Author, b.CurrentProgress, b.TotalProgress, b.ProgressType, b.TargetDate, b.CompletedAt, b.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert book %s: %w", b.ID, err)
	}
	return nil
}

func (s *Store) GetBook(id string) (model.Book, error) {
	row := s.DB.QueryRow(`SELECT `+bookColumns+` FROM books WHERE id = ?`, id)
	b, err := scanBook(row)
	if errors.Is(err, sql.ErrNoRows) {
		return model.Book{}, fmt.Errorf("get book %s: %w", id, ErrNotFound)
	}
	if err != nil {
		return model.Book{}, fmt.Errorf("get book %s: %w", id, err)
	}
	return b, nil
}

func (s *Store) ListActiveBooks() ([]model.Book, error) {
	return s.queryBooks(`SELECT ` + bookColumns + ` FROM books WHERE completed_at IS NULL ORDER BY created_at DESC`)
}

func (s *Store) ListCompletedBooks() ([]model.Book, error) {
	return s.queryBooks(`SELECT ` + bookColumns + ` FROM books WHERE completed_at IS NOT NULL ORDER BY completed_at DESC`)
}

func (s *Store) ListAllBooks() ([]model.Book, error) {
	return s.queryBooks(`SELECT ` + bookColumns + ` FROM books ORDER BY created_at DESC`)
}

func (s *Store) UpdateBook(b model.Book) error {
	res, err := s.DB.Exec(
		`UPDATE books SET title = ?, author = ?, current_progress = ?, total_progress = ?, progress_type = ?, target_date = ?, completed_at = ? WHERE id = ?`,
		b.Title, b.Author, b.CurrentProgress, b.TotalProgress, b.ProgressType, b.TargetDate, b.CompletedAt, b.ID,
	)
	if err != nil {
		return fmt.Errorf("update book %s: %w", b.ID, err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("update book %s rows: %w", b.ID, err)
	}
	if n == 0 {
		return fmt.Errorf("update book %s: %w", b.ID, ErrNotFound)
	}
	return nil
}

func (s *Store) DeleteBook(id string) error {
	if _, err := s.DB.Exec(`DELETE FROM books WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete book %s: %w", id, err)
	}
	return nil
}

func (s *Store) queryBooks(query string, args ...any) ([]model.Book, error) {
	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("query books: %w", err)
	}
	defer rows.Close()
	var out []model.Book
	for rows.Next() {
		b, err := scanBook(rows)
		if err != nil {
			return nil, fmt.Errorf("scan book: %w", err)
		}
		out = append(out, b)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate books: %w", err)
	}
	return out, nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanBook(s scanner) (model.Book, error) {
	var b model.Book
	err := s.Scan(&b.ID, &b.Title, &b.Author, &b.CurrentProgress, &b.TotalProgress, &b.ProgressType, &b.TargetDate, &b.CompletedAt, &b.CreatedAt)
	return b, err
}
