package main

import (
	"errors"
	"fmt"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var errNoRuntimeContext = errors.New("wails runtime context not initialized")

func writeStringToFile(path, contents string) error {
	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		return fmt.Errorf("write csv to %s: %w", path, err)
	}
	return nil
}

// OpenCSVFile prompts the user for a CSV file and returns its contents.
// Returns ("", nil) if the user cancels the dialog.
func (a *App) OpenCSVFile() (string, error) {
	if a.ctx == nil {
		return "", errNoRuntimeContext
	}
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Import CSV",
		Filters: []runtime.FileFilter{
			{DisplayName: "CSV (*.csv)", Pattern: "*.csv"},
		},
	})
	if err != nil {
		return "", fmt.Errorf("open csv dialog: %w", err)
	}
	if path == "" {
		return "", nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("read csv from %s: %w", path, err)
	}
	return string(data), nil
}

// SaveCSVFile prompts the user for a destination and writes contents there.
// Returns (false, nil) if the user cancels.
func (a *App) SaveCSVFile(defaultFilename, contents string) (bool, error) {
	if a.ctx == nil {
		return false, errNoRuntimeContext
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export CSV",
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "CSV (*.csv)", Pattern: "*.csv"},
		},
	})
	if err != nil {
		return false, fmt.Errorf("save csv dialog: %w", err)
	}
	if path == "" {
		return false, nil
	}
	if err := writeStringToFile(path, contents); err != nil {
		return false, err
	}
	return true, nil
}
