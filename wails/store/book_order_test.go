package store

import (
	"path/filepath"
	"reflect"
	"testing"
)

func openMemoryStore(t *testing.T) *Store {
	t.Helper()
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })
	return s
}

// The frontend renders the result directly, so "nothing saved" must be an
// empty list rather than null.
func TestGetBookOrder_EmptyReturnsNonNilSlice(t *testing.T) {
	s := openMemoryStore(t)
	got, err := s.GetBookOrder()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got == nil || len(got) != 0 {
		t.Fatalf("want empty non-nil slice, got %#v", got)
	}
}

func TestSetBookOrder(t *testing.T) {
	tests := []struct {
		name      string
		first     []string
		then      []string // applied only when saveTwice is set; must fully replace the first
		saveTwice bool
		want      []string
	}{
		{name: "round trips in given order", first: []string{"c", "a", "b"}, want: []string{"c", "a", "b"}},
		{name: "second save replaces the first", first: []string{"a", "b", "c"}, then: []string{"b"}, saveTwice: true, want: []string{"b"}},
		{name: "empty list clears the order", first: []string{"a", "b"}, then: []string{}, saveTwice: true, want: []string{}},
		{name: "unknown ids are skipped, not fatal", first: []string{"a", "ghost", "b"}, want: []string{"a", "b"}},
		{name: "nil list clears the order", first: []string{"a"}, then: nil, saveTwice: true, want: []string{}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := openMemoryStore(t)
			for _, id := range []string{"a", "b", "c"} {
				insertTestBook(t, s, id)
			}
			if err := s.SetBookOrder(tt.first); err != nil {
				t.Fatalf("set first: %v", err)
			}
			if tt.saveTwice {
				if err := s.SetBookOrder(tt.then); err != nil {
					t.Fatalf("set second: %v", err)
				}
			}
			got, err := s.GetBookOrder()
			if err != nil {
				t.Fatalf("get: %v", err)
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Fatalf("want %v, got %v", tt.want, got)
			}
		})
	}
}

// Foreign keys are not enabled on the connection, so cascade never fires;
// DeleteBook must clean up the order row itself.
func TestDeleteBook_RemovesFromBookOrder(t *testing.T) {
	s := openMemoryStore(t)
	for _, id := range []string{"a", "b"} {
		insertTestBook(t, s, id)
	}
	if err := s.SetBookOrder([]string{"a", "b"}); err != nil {
		t.Fatalf("set: %v", err)
	}
	if err := s.DeleteBook("a"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	got, err := s.GetBookOrder()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if !reflect.DeepEqual(got, []string{"b"}) {
		t.Fatalf("want [b], got %v", got)
	}
}

func TestBookOrder_FileBacked_PersistsAcrossReopen(t *testing.T) {
	path := filepath.Join(t.TempDir(), "book-tracker.db")
	s1, err := Open(path)
	if err != nil {
		t.Fatalf("open 1: %v", err)
	}
	for _, id := range []string{"a", "b", "c"} {
		insertTestBook(t, s1, id)
	}
	if err := s1.SetBookOrder([]string{"b", "c", "a"}); err != nil {
		t.Fatalf("set: %v", err)
	}
	_ = s1.Close()

	s2, err := Open(path)
	if err != nil {
		t.Fatalf("open 2: %v", err)
	}
	defer s2.Close()
	got, err := s2.GetBookOrder()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if !reflect.DeepEqual(got, []string{"b", "c", "a"}) {
		t.Fatalf("want [b c a], got %v", got)
	}
}
