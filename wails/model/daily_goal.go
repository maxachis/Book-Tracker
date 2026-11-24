package model

// DailyGoal is the progress range a reader aims to cover in one book on one
// local calendar date. Start is where the book stood when the day began.
type DailyGoal struct {
	BookID string `json:"book_id"`
	Date   string `json:"date"`
	Start  int    `json:"start"`
	End    int    `json:"end"`
}
