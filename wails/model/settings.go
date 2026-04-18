package model

type UserSettings struct {
	ID               int     `json:"id"`
	ReadingStartHour int     `json:"reading_start_hour"`
	ReadingEndHour   int     `json:"reading_end_hour"`
	StatsStartDate   *string `json:"stats_start_date,omitempty"`
}

type UpdateSettingsRequest struct {
	ReadingStartHour *int    `json:"reading_start_hour,omitempty"`
	ReadingEndHour   *int    `json:"reading_end_hour,omitempty"`
	StatsStartDate   *string `json:"stats_start_date,omitempty"`
}

func DefaultSettings() UserSettings {
	return UserSettings{
		ID:               1,
		ReadingStartHour: 8,
		ReadingEndHour:   22,
	}
}
