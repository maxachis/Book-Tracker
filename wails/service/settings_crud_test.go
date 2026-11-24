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

func TestUpdateSettings_LocationStepMergesWithoutDisturbingHours(t *testing.T) {
	// The frontend saves one setting at a time, so a location-step-only
	// update must keep the hours and an hours-only update must keep the step.
	svc := newTestService(t)
	step := 250
	got, err := svc.UpdateSettings(model.UpdateSettingsRequest{LocationStep: &step})
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if got.LocationStep != 250 || got.ReadingStartHour != 8 || got.ReadingEndHour != 22 {
		t.Fatalf("unexpected merge: %+v", got)
	}

	start := 6
	got, err = svc.UpdateSettings(model.UpdateSettingsRequest{ReadingStartHour: &start})
	if err != nil {
		t.Fatalf("update hours: %v", err)
	}
	if got.LocationStep != 250 {
		t.Fatalf("hours update reset location step: %+v", got)
	}
	reloaded, _ := svc.GetSettings()
	if reloaded.LocationStep != 250 {
		t.Fatalf("not persisted: %+v", reloaded)
	}
}

func TestGetSettings_DefaultLocationStepWhenRowMissing(t *testing.T) {
	// The fallback defaults must carry the 100-location step, not zero.
	if model.DefaultSettings().LocationStep != 100 {
		t.Fatalf("want 100, got %d", model.DefaultSettings().LocationStep)
	}
}

func TestValidateSettings_LocationStepBounds(t *testing.T) {
	// A step below 1 would divide by zero in due-date math and an enormous
	// one is nonsense, so only [1, 100000] is accepted.
	tests := []struct {
		name    string
		step    int
		wantErr bool
	}{
		{"zero rejected", 0, true},
		{"negative rejected", -5, true},
		{"minimum accepted", 1, false},
		{"maximum accepted", 100000, false},
		{"above maximum rejected", 100001, true},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			step := tc.step
			err := ValidateSettings(model.UpdateSettingsRequest{LocationStep: &step})
			if tc.wantErr {
				if err == nil || !strings.Contains(err.Error(), "location step must be between 1 and 100000") {
					t.Fatalf("expected range error, got %v", err)
				}
			} else if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}
