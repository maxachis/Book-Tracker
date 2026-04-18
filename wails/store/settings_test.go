package store

import (
	"path/filepath"
	"testing"
)

func TestGetSettings_SeededDefaults(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	got, err := s.GetSettings()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.ID != 1 || got.ReadingStartHour != 8 || got.ReadingEndHour != 22 {
		t.Fatalf("unexpected seeded settings: %+v", got)
	}
	if got.StatsStartDate != nil {
		t.Fatalf("expected nil stats_start_date, got %v", *got.StatsStartDate)
	}
}

func TestUpdateSettings_PersistsFields(t *testing.T) {
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	stats := "2026-01-01"
	got, err := s.GetSettings()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	got.ReadingStartHour = 6
	got.ReadingEndHour = 23
	got.StatsStartDate = &stats
	if err := s.UpdateSettings(got); err != nil {
		t.Fatalf("update: %v", err)
	}

	reloaded, err := s.GetSettings()
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	if reloaded.ReadingStartHour != 6 || reloaded.ReadingEndHour != 23 {
		t.Fatalf("hours not saved: %+v", reloaded)
	}
	if reloaded.StatsStartDate == nil || *reloaded.StatsStartDate != stats {
		t.Fatalf("stats_start_date not saved: %+v", reloaded.StatsStartDate)
	}
}

func TestSettings_FileBacked(t *testing.T) {
	dir := t.TempDir()
	s, err := Open(filepath.Join(dir, "file.db"))
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	cur, err := s.GetSettings()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	cur.ReadingStartHour = 7
	if err := s.UpdateSettings(cur); err != nil {
		t.Fatalf("update: %v", err)
	}
	got, err := s.GetSettings()
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	if got.ReadingStartHour != 7 {
		t.Fatalf("want 7, got %d", got.ReadingStartHour)
	}
}
