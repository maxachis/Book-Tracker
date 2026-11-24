package service

import (
	"testing"

	"github.com/maxachis/book-tracker/wails/model"
)

func TestSetDailyGoal_Validation(t *testing.T) {
	tests := []struct {
		name    string
		goal    model.DailyGoal
		wantErr bool
	}{
		{name: "valid goal", goal: model.DailyGoal{BookID: "a", Date: "2026-01-01", Start: 10, End: 20}},
		{name: "empty range is allowed", goal: model.DailyGoal{BookID: "a", Date: "2026-01-01", Start: 10, End: 10}},
		// Mid-edit the reader can raise Start past End before raising End; that state must still save.
		{name: "end before start is saved", goal: model.DailyGoal{BookID: "a", Date: "2026-01-01", Start: 20, End: 10}},
		{name: "malformed date is rejected", goal: model.DailyGoal{BookID: "a", Date: "01/02/2026", Start: 1, End: 2}, wantErr: true},
		{name: "empty date is rejected", goal: model.DailyGoal{BookID: "a", Date: "", Start: 1, End: 2}, wantErr: true},
		{name: "missing book id is rejected", goal: model.DailyGoal{Date: "2026-01-01", Start: 1, End: 2}, wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := newTestService(t)
			err := svc.SetDailyGoal(tt.goal)
			if (err != nil) != tt.wantErr {
				t.Fatalf("wantErr=%v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestGetDailyGoals_Validation(t *testing.T) {
	tests := []struct {
		name    string
		date    string
		wantErr bool
	}{
		{name: "valid date", date: "2026-01-01"},
		{name: "malformed date is rejected", date: "2026-1-1x", wantErr: true},
		{name: "empty date is rejected", date: "", wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := newTestService(t)
			got, err := svc.GetDailyGoals(tt.date)
			if (err != nil) != tt.wantErr {
				t.Fatalf("wantErr=%v, got %v", tt.wantErr, err)
			}
			if err == nil && got == nil {
				t.Fatal("want non-nil slice")
			}
		})
	}
}
