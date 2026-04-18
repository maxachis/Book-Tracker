package main

import (
	"context"

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
