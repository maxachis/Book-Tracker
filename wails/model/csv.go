package model

// CSVBookRecord mirrors the TypeScript CsvBookRecord shape used by the
// import/export flow. Author, TargetDate, and CompletedAt are pointers so
// absent values round-trip as JSON null rather than empty strings.
type CSVBookRecord struct {
	Title           string  `json:"title"`
	Author          *string `json:"author,omitempty"`
	CurrentProgress int     `json:"current_progress"`
	TotalProgress   int     `json:"total_progress"`
	ProgressType    string  `json:"progress_type"`
	TargetDate      *string `json:"target_date,omitempty"`
	CompletedAt     *string `json:"completed_at,omitempty"`
}

// DuplicateReport identifies a CSV row that collides with an existing
// book by case-insensitive title+author.
type DuplicateReport struct {
	Title  string  `json:"title"`
	Author *string `json:"author,omitempty"`
}
