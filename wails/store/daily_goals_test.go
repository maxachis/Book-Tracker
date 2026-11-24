package store

import (
	"path/filepath"
	"reflect"
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
)

// The frontend iterates the result directly, so "no goals today" must be an
// empty list rather than null.
func TestGetDailyGoals_EmptyReturnsNonNilSlice(t *testing.T) {
	s := openMemoryStore(t)
	got, err := s.GetDailyGoals("2026-01-01")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got == nil || len(got) != 0 {
		t.Fatalf("want empty non-nil slice, got %#v", got)
	}
}

func TestSetDailyGoal(t *testing.T) {
	tests := []struct {
		name  string
		saves []model.DailyGoal
		date  string
		want  []model.DailyGoal
	}{
		{
			name:  "round trips a goal for its date",
			saves: []model.DailyGoal{{BookID: "a", Date: "2026-01-01", Start: 10, End: 30}},
			date:  "2026-01-01",
			want:  []model.DailyGoal{{BookID: "a", Date: "2026-01-01", Start: 10, End: 30}},
		},
		{
			name: "saving again for the same book and date replaces the goal",
			saves: []model.DailyGoal{
				{BookID: "a", Date: "2026-01-01", Start: 10, End: 30},
				{BookID: "a", Date: "2026-01-01", Start: 10, End: 50},
			},
			date: "2026-01-01",
			want: []model.DailyGoal{{BookID: "a", Date: "2026-01-01", Start: 10, End: 50}},
		},
		{
			name: "goals from other dates are excluded",
			saves: []model.DailyGoal{
				{BookID: "a", Date: "2026-01-01", Start: 10, End: 30},
				{BookID: "a", Date: "2026-01-02", Start: 30, End: 60},
			},
			date: "2026-01-02",
			want: []model.DailyGoal{{BookID: "a", Date: "2026-01-02", Start: 30, End: 60}},
		},
		{
			name: "each book keeps its own goal on the same date",
			saves: []model.DailyGoal{
				{BookID: "b", Date: "2026-01-01", Start: 1, End: 2},
				{BookID: "a", Date: "2026-01-01", Start: 10, End: 30},
			},
			date: "2026-01-01",
			want: []model.DailyGoal{
				{BookID: "a", Date: "2026-01-01", Start: 10, End: 30},
				{BookID: "b", Date: "2026-01-01", Start: 1, End: 2},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := openMemoryStore(t)
			for _, id := range []string{"a", "b"} {
				insertTestBook(t, s, id)
			}
			for _, g := range tt.saves {
				if err := s.SetDailyGoal(g); err != nil {
					t.Fatalf("set: %v", err)
				}
			}
			got, err := s.GetDailyGoals(tt.date)
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
// DeleteBook must clean up the goal rows itself.
func TestDeleteBook_RemovesDailyGoals(t *testing.T) {
	s := openMemoryStore(t)
	for _, id := range []string{"a", "b"} {
		insertTestBook(t, s, id)
		if err := s.SetDailyGoal(model.DailyGoal{BookID: id, Date: "2026-01-01", Start: 0, End: 5}); err != nil {
			t.Fatalf("set: %v", err)
		}
	}
	if err := s.DeleteBook("a"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	got, err := s.GetDailyGoals("2026-01-01")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	want := []model.DailyGoal{{BookID: "b", Date: "2026-01-01", Start: 0, End: 5}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("want %v, got %v", want, got)
	}
}

func TestDailyGoals_FileBacked_PersistsAcrossReopen(t *testing.T) {
	path := filepath.Join(t.TempDir(), "book-tracker.db")
	s1, err := Open(path)
	if err != nil {
		t.Fatalf("open 1: %v", err)
	}
	insertTestBook(t, s1, "a")
	goal := model.DailyGoal{BookID: "a", Date: "2026-01-01", Start: 12, End: 40}
	if err := s1.SetDailyGoal(goal); err != nil {
		t.Fatalf("set: %v", err)
	}
	_ = s1.Close()

	s2, err := Open(path)
	if err != nil {
		t.Fatalf("open 2: %v", err)
	}
	defer s2.Close()
	got, err := s2.GetDailyGoals("2026-01-01")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if !reflect.DeepEqual(got, []model.DailyGoal{goal}) {
		t.Fatalf("want [%v], got %v", goal, got)
	}
}
