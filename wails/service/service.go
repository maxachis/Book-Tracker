package service

import "github.com/maxachis/book-tracker/wails/store"

// Service holds business logic (validation, goal calculations, CSV).
type Service struct {
	Store *store.Store
}

func New(s *store.Store) *Service {
	return &Service{Store: s}
}
