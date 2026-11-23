package store

import (
	"fmt"
)

// GetBookOrder returns book IDs in the user's saved display order. It returns
// an empty (non-nil) slice when no order has been saved.
func (s *Store) GetBookOrder() ([]string, error) {
	rows, err := s.DB.Query(`SELECT book_id FROM book_order ORDER BY position ASC`)
	if err != nil {
		return nil, fmt.Errorf("query book order: %w", err)
	}
	defer rows.Close()
	ids := []string{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan book order: %w", err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate book order: %w", err)
	}
	return ids, nil
}

// SetBookOrder replaces the saved order with ids (positions 0..n-1) in one
// transaction. IDs that no longer exist in books are skipped so a save racing
// a delete does not fail; positions stay contiguous over the surviving IDs.
func (s *Store) SetBookOrder(ids []string) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return fmt.Errorf("begin set book order: %w", err)
	}
	defer func() { _ = tx.Rollback() }() // no-op after Commit

	if _, err := tx.Exec(`DELETE FROM book_order`); err != nil {
		return fmt.Errorf("clear book order: %w", err)
	}
	position := 0
	for _, id := range ids {
		res, err := tx.Exec(
			`INSERT OR IGNORE INTO book_order (book_id, position)
			 SELECT id, ? FROM books WHERE id = ?`, position, id)
		if err != nil {
			return fmt.Errorf("insert book order %s: %w", id, err)
		}
		inserted, err := res.RowsAffected()
		if err != nil {
			return fmt.Errorf("book order rows affected %s: %w", id, err)
		}
		position += int(inserted)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit book order: %w", err)
	}
	return nil
}
