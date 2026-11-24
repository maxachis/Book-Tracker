package store

import (
	"path/filepath"
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
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

func TestGetSettings_DefaultLocationStep(t *testing.T) {
	// A fresh database must report the default location step so due-date
	// targets keep their 100-location checkpoints until the user changes it.
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	got, err := s.GetSettings()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.LocationStep != model.DefaultLocationStep {
		t.Fatalf("want default %d, got %d", model.DefaultLocationStep, got.LocationStep)
	}
}

func TestUpdateSettings_PersistsLocationStep(t *testing.T) {
	// A saved location step must survive a reload, and saving other fields
	// from a freshly loaded row must not reset it.
	s, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer s.Close()

	got, _ := s.GetSettings()
	got.LocationStep = 250
	if err := s.UpdateSettings(got); err != nil {
		t.Fatalf("update: %v", err)
	}
	reloaded, _ := s.GetSettings()
	if reloaded.LocationStep != 250 {
		t.Fatalf("want 250, got %d", reloaded.LocationStep)
	}

	reloaded.ReadingStartHour = 5
	if err := s.UpdateSettings(reloaded); err != nil {
		t.Fatalf("update hours: %v", err)
	}
	again, _ := s.GetSettings()
	if again.LocationStep != 250 || again.ReadingStartHour != 5 {
		t.Fatalf("hours update disturbed location step: %+v", again)
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
	if got.LocationStep != model.DefaultLocationStep {
		t.Fatalf("want default location step, got %d", got.LocationStep)
	}
}
