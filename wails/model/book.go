package model

type ProgressType string

const (
	ProgressPage       ProgressType = "page"
	ProgressLocation   ProgressType = "location"
	ProgressPercentage ProgressType = "percentage"
)

type Book struct {
	ID              string  `json:"id"`
	Title           string  `json:"title"`
	Author          *string `json:"author,omitempty"`
	CurrentProgress int     `json:"current_progress"`
	TotalProgress   int     `json:"total_progress"`
	ProgressType    string  `json:"progress_type"`
	TargetDate      *string `json:"target_date,omitempty"`
	CompletedAt     *string `json:"completed_at,omitempty"`
	CreatedAt       string  `json:"created_at"`
}

type CreateBookRequest struct {
	Title         string  `json:"title"`
	Author        *string `json:"author,omitempty"`
	TotalProgress int     `json:"total_progress"`
	ProgressType  string  `json:"progress_type"`
	TargetDate    *string `json:"target_date,omitempty"`
}

type UpdateBookRequest struct {
	ID              string  `json:"id"`
	Title           *string `json:"title,omitempty"`
	Author          *string `json:"author,omitempty"`
	CurrentProgress *int    `json:"current_progress,omitempty"`
	TotalProgress   *int    `json:"total_progress,omitempty"`
	ProgressType    *string `json:"progress_type,omitempty"`
	TargetDate      *string `json:"target_date,omitempty"`
}
