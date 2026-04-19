# Book Tracker

A desktop application for tracking your reading progress, built with Wails v2, Svelte 5, and SQLite.

## Features

- **Track Multiple Books**: Add books with page numbers, Kindle locations, or percentage-based progress
- **Reading Goals**: Automatically calculates pages/day and pages/hour based on your target completion date
- **Reading Hours**: Configure your typical reading hours to get accurate hourly goals
- **Progress Tracking**: Update progress as you read; books auto-complete when you reach the end
- **Statistics**: View completion rates and track your reading habits over time
- **Import/Export**: Backup and restore your library via CSV files

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Go](https://go.dev/) 1.22+
- [Wails CLI](https://wails.io/): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Platform dependencies: [see Wails prerequisites](https://wails.io/docs/gettingstarted/installation#platform-specific-dependencies)

### Setup

```bash
git clone <repository-url>
cd Book-Tracker/wails/frontend && npm install
```

## Development

```bash
cd wails && wails dev
```

## Building

```bash
cd wails && wails build
```

The executable will be created at `wails/build/bin/book-tracker` (or `.exe` on Windows).

## Usage

### Adding a Book

1. Click **+ Add Book** on the Active Books view
2. Enter the book title and optionally the author
3. Select progress type:
   - **Pages**: For physical books or fixed-layout ebooks
   - **Locations**: For Kindle books
   - **Percentage**: For any format
4. Enter the end page/location/percentage
5. Optionally set a target completion date
6. Click **Add Book**

### Updating Progress

- Use the progress input on each book card to update your current position
- Books automatically move to "Completed" when you reach the end
- Use **Mark Complete** to finish a book early

### Reading Goals

When you set a target date, the app calculates:
- **Pages/day**: How much to read daily to finish on time
- **Pages/hour**: Based on your configured reading hours
- **Days left**: Countdown to your target date

Overdue books are highlighted in red.

### Settings

- **Reading Hours**: Set your typical reading window (e.g., 8:00 - 22:00)
- **Statistics Start Date**: Filter stats to only include books added after a certain date

### Import/Export

- **Export**: Save all books to a CSV file for backup
- **Import**: Load books from a CSV file (rejects duplicates by title + author)

## Project Structure

```
Book-Tracker/
├── wails/
│   ├── main.go                 # Wails bootstrap
│   ├── app.go                  # IPC endpoints
│   ├── store/                  # SQLite persistence
│   ├── model/                  # Data structures
│   ├── service/                # Business logic (validation, CSV, calculations)
│   ├── migrations/             # Embedded SQL migrations
│   └── frontend/               # Svelte 5 frontend
│       └── src/
│           ├── lib/components/ # UI components
│           ├── lib/services/   # Calculations & date helpers
│           ├── lib/stores/     # Svelte 5 state
│           └── views/          # Main views
├── bucket/                     # Scoop manifest
└── deprecated/src-tauri/       # Retired Tauri backend (archived)
```

## Technologies

- **Frontend**: [Svelte 5](https://svelte.dev/) with TypeScript
- **Backend**: [Wails v2](https://wails.io/) (Go)
- **Database**: SQLite via [modernc.org/sqlite](https://pkg.go.dev/modernc.org/sqlite) (pure Go)
- **Build Tool**: [Vite](https://vitejs.dev/)

## License

MIT
