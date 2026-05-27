package model

type ReadingSession struct {
	BookID        string `json:"book_id"`
	Date          string `json:"date"`
	ProgressDelta int    `json:"progress_delta"`
}

type BookSessionSummary struct {
	BookID        string `json:"book_id"`
	Title         string `json:"title"`
	ProgressDelta int    `json:"progress_delta"`
	ProgressType  string `json:"progress_type"`
}

type DailyReadingSummary struct {
	Date  string               `json:"date"`
	Books []BookSessionSummary `json:"books"`
}
