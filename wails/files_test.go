package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestWriteStringToFile(t *testing.T) {
	t.Run("writes contents to path", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "out.csv")
		if err := writeStringToFile(path, "hello,world\n"); err != nil {
			t.Fatalf("writeStringToFile: %v", err)
		}
		got, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("read back: %v", err)
		}
		if string(got) != "hello,world\n" {
			t.Fatalf("unexpected contents: %q", string(got))
		}
	})

	t.Run("overwrites existing file", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "out.csv")
		if err := os.WriteFile(path, []byte("old"), 0o644); err != nil {
			t.Fatal(err)
		}
		if err := writeStringToFile(path, "new"); err != nil {
			t.Fatalf("writeStringToFile: %v", err)
		}
		got, _ := os.ReadFile(path)
		if string(got) != "new" {
			t.Fatalf("expected overwrite, got %q", string(got))
		}
	})

	t.Run("wraps error with path context", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "missing", "nested", "out.csv")
		err := writeStringToFile(path, "x")
		if err == nil {
			t.Fatal("expected error writing to nonexistent directory")
		}
		if !strings.Contains(err.Error(), path) {
			t.Fatalf("error should mention path: %v", err)
		}
	})
}
