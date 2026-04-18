package service

import (
	"strings"
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
)

func TestValidateProgressUpdate(t *testing.T) {
	tests := []struct {
		name    string
		current int
		total   int
		wantErr string
	}{
		{"zero ok", 0, 100, ""},
		{"equal ok", 100, 100, ""},
		{"under ok", 50, 100, ""},
		{"negative", -1, 100, "negative"},
		{"over", 101, 100, "exceed"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateProgressUpdate(tc.current, tc.total)
			if tc.wantErr == "" {
				if err != nil {
					t.Fatalf("want nil, got %v", err)
				}
				return
			}
			if err == nil || !strings.Contains(strings.ToLower(err.Error()), tc.wantErr) {
				t.Fatalf("want error containing %q, got %v", tc.wantErr, err)
			}
		})
	}
}

func TestValidateSettings(t *testing.T) {
	i := func(v int) *int { return &v }
	tests := []struct {
		name    string
		req     model.UpdateSettingsRequest
		wantErr string
	}{
		{"empty ok", model.UpdateSettingsRequest{}, ""},
		{"valid pair", model.UpdateSettingsRequest{ReadingStartHour: i(8), ReadingEndHour: i(22)}, ""},
		{"start negative", model.UpdateSettingsRequest{ReadingStartHour: i(-1)}, "start"},
		{"start too large", model.UpdateSettingsRequest{ReadingStartHour: i(24)}, "start"},
		{"end negative", model.UpdateSettingsRequest{ReadingEndHour: i(-1)}, "end"},
		{"end too large", model.UpdateSettingsRequest{ReadingEndHour: i(24)}, "end"},
		{"start equal end", model.UpdateSettingsRequest{ReadingStartHour: i(10), ReadingEndHour: i(10)}, "less than"},
		{"start after end", model.UpdateSettingsRequest{ReadingStartHour: i(22), ReadingEndHour: i(6)}, "less than"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateSettings(tc.req)
			if tc.wantErr == "" {
				if err != nil {
					t.Fatalf("want nil, got %v", err)
				}
				return
			}
			if err == nil || !strings.Contains(strings.ToLower(err.Error()), tc.wantErr) {
				t.Fatalf("want error containing %q, got %v", tc.wantErr, err)
			}
		})
	}
}
