package model

const (
	// DefaultLocationStep is how many locations make one "due" checkpoint.
	DefaultLocationStep = 100
	MinLocationStep     = 1
	MaxLocationStep     = 100000
)

type UserSettings struct {
	ID               int     `json:"id"`
	ReadingStartHour int     `json:"reading_start_hour"`
	ReadingEndHour   int     `json:"reading_end_hour"`
	StatsStartDate   *string `json:"stats_start_date,omitempty"`
	LocationStep     int     `json:"location_step"`
}

type UpdateSettingsRequest struct {
	ReadingStartHour *int    `json:"reading_start_hour,omitempty"`
	ReadingEndHour   *int    `json:"reading_end_hour,omitempty"`
	StatsStartDate   *string `json:"stats_start_date,omitempty"`
	LocationStep     *int    `json:"location_step,omitempty"`
}

func DefaultSettings() UserSettings {
	return UserSettings{
		ID:               1,
		ReadingStartHour: 8,
		ReadingEndHour:   22,
		LocationStep:     DefaultLocationStep,
	}
}
