package main

import (
	"context"
	"time"

	"github.com/maxachis/book-tracker/wails/model"
	"github.com/maxachis/book-tracker/wails/service"
)

// App is the root object exposed to the frontend. Every exported method
// becomes a callable IPC endpoint via `window.go.main.App.<Method>`.
type App struct {
	ctx     context.Context
	service *service.Service
}

func NewApp(svc *service.Service) *App {
	return &App{service: svc}
}

// startup is invoked by Wails when the window is ready.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GenerateBookID returns a fresh UUIDv4 for use as a new book's primary key.
// Exposed to the frontend as window.go.main.App.GenerateBookID().
func (a *App) GenerateBookID() string {
	return service.GenerateBookID()
}

// ValidateCreateBookRequest returns an error string if the request is
// invalid, or an empty string if it passes validation. Wails surfaces Go
// errors awkwardly across the IPC boundary, so we return a string the
// frontend can treat as truthy/falsy.
func (a *App) ValidateCreateBookRequest(r model.CreateBookRequest) string {
	if err := service.ValidateCreateBookRequest(r); err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) CreateBook(req model.CreateBookRequest) (model.Book, error) {
	return a.service.CreateBook(req)
}

func (a *App) ListActiveBooks() ([]model.Book, error) {
	return a.service.Store.ListActiveBooks()
}

func (a *App) ListCompletedBooks() ([]model.Book, error) {
	return a.service.Store.ListCompletedBooks()
}

func (a *App) ListAllBooks() ([]model.Book, error) {
	return a.service.Store.ListAllBooks()
}

func (a *App) UpdateBook(req model.UpdateBookRequest) (model.Book, error) {
	return a.service.UpdateBook(req)
}

func (a *App) DeleteBook(id string) error {
	return a.service.Store.DeleteBook(id)
}

func (a *App) MarkBookComplete(id string) (model.Book, error) {
	return a.service.MarkBookComplete(id)
}

func (a *App) GetSettings() (model.UserSettings, error) {
	return a.service.GetSettings()
}

func (a *App) UpdateSettings(req model.UpdateSettingsRequest) (model.UserSettings, error) {
	return a.service.UpdateSettings(req)
}

// ValidateProgressUpdate returns "" if the progress delta is valid, else
// the error message. progressType is accepted for parity with the legacy
// Rust IPC signature; it is not currently used for validation.
func (a *App) ValidateProgressUpdate(current, total int, progressType string) string {
	if err := service.ValidateProgressUpdate(current, total); err != nil {
		return err.Error()
	}
	return ""
}

// ValidateSettings returns "" if the settings request is valid, else the
// error message.
func (a *App) ValidateSettings(req model.UpdateSettingsRequest) string {
	if err := service.ValidateSettings(req); err != nil {
		return err.Error()
	}
	return ""
}

// NowTimestamp returns the current UTC time as an RFC3339 string.
func (a *App) NowTimestamp() string {
	return time.Now().UTC().Format(time.RFC3339)
}

func (a *App) ParseCSVBooks(content string) ([]model.CSVBookRecord, error) {
	return service.ParseCSVBooks(content)
}

func (a *App) GenerateCSVExport(books []model.Book) (string, error) {
	return service.GenerateCSVExport(books)
}

// CheckDuplicates loads all persisted books and returns any CSV rows that
// collide with an existing book by case-insensitive title+author.
func (a *App) CheckDuplicates(records []model.CSVBookRecord) ([]model.DuplicateReport, error) {
	existing, err := a.service.Store.ListAllBooks()
	if err != nil {
		return nil, err
	}
	return service.CheckDuplicates(records, existing), nil
}

