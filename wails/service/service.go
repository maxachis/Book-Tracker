package service

import "github.com/maxachis/book-tracker/wails/store"

// Service holds business logic (validation, goal calculations, CSV).
// Wire concrete methods here as they are ported from src-tauri and
// src/lib/services/calculations.ts. Port behind failing tests first.
type Service struct {
	Store *store.Store
}

func New(s *store.Store) *Service {
	return &Service{Store: s}
}
