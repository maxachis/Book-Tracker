package main

import (
	"embed"
	"log"

	"github.com/maxachis/book-tracker/wails/service"
	"github.com/maxachis/book-tracker/wails/store"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	dbPath, err := store.DefaultDBPath()
	if err != nil {
		log.Fatalf("resolve db path: %v", err)
	}
	s, err := store.Open(dbPath)
	if err != nil {
		log.Fatalf("open store: %v", err)
	}
	defer s.Close()

	app := NewApp(service.New(s))

	err = wails.Run(&options.App{
		Title:            "Book Tracker",
		Width:            1024,
		Height:           768,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind:             []interface{}{app},
	})
	if err != nil {
		log.Fatalf("wails run: %v", err)
	}
}
