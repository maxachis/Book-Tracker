package service

import (
	"testing"

	"github.com/maxachis/book-tracker/wails/store"
)

func newTestService(t *testing.T) *Service {
	t.Helper()
	s, err := store.Open(":memory:")
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })
	return New(s)
}
