package service

import (
	"strings"
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
)

func TestGetSettings_DefaultsWhenMissing(t *testing.T) {
	svc := newTestService(t)
	if _, err := svc.Store.DB.Exec(`DELETE FROM user_settings`); err != nil {
		t.Fatalf("delete: %v", err)
	}
	got, err := svc.GetSettings()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.ReadingStartHour != 8 || got.ReadingEndHour != 22 {
		t.Fatalf("expected defaults, got %+v", got)
	}
	if got.StatsStartDate != nil {
		t.Fatalf("expected nil stats_start_date, got %v", *got.StatsStartDate)
	}
}

func TestUpdateSettings_MergesAndValidates(t *testing.T) {
	svc := newTestService(t)
	start := 5
	end := 10
	got, err := svc.UpdateSettings(model.UpdateSettingsRequest{ReadingStartHour: &start, ReadingEndHour: &end})
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if got.ReadingStartHour != 5 || got.ReadingEndHour != 10 {
		t.Fatalf("not merged: %+v", got)
	}

	stats := "2026-01-01"
	got2, err := svc.UpdateSettings(model.UpdateSettingsRequest{StatsStartDate: &stats})
	if err != nil {
		t.Fatalf("update2: %v", err)
	}
	if got2.ReadingStartHour != 5 || got2.ReadingEndHour != 10 {
		t.Fatalf("prior fields lost: %+v", got2)
	}
	if got2.StatsStartDate == nil || *got2.StatsStartDate != stats {
		t.Fatalf("stats_start_date not saved: %+v", got2.StatsStartDate)
	}
}

func TestUpdateSettings_InvalidRange(t *testing.T) {
	svc := newTestService(t)
	bad := 24
	_, err := svc.UpdateSettings(model.UpdateSettingsRequest{ReadingStartHour: &bad})
	if err == nil || !strings.Contains(strings.ToLower(err.Error()), "start") {
		t.Fatalf("expected start-hour range error, got %v", err)
	}

	start := 10
	end := 5
	_, err = svc.UpdateSettings(model.UpdateSettingsRequest{ReadingStartHour: &start, ReadingEndHour: &end})
	if err == nil {
		t.Fatal("expected start>=end error")
	}
}
