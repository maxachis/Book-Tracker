# Book Tracker

A desktop application for tracking your reading progress, built with Tauri, Svelte 5, and SQLite.

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
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific dependencies for Tauri: [see Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd Book-Tracker

# Install dependencies
npm install
```

## Development

```bash
# Run in development mode with hot reload
npm run tauri dev
```

## Building

```bash
# Build for production
npm run tauri build
```

The executable will be created at:
- **Windows**: `src-tauri/target/release/Book Tracker.exe`
- **Installers**: `src-tauri/target/release/bundle/`

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
├── src/                        # Svelte frontend
│   ├── App.svelte
│   ├── lib/
│   │   ├── components/         # UI components
│   │   ├── services/           # Database & calculations
│   │   ├── stores/             # Svelte 5 state management
│   │   └── types/              # TypeScript interfaces
│   └── views/                  # Main views
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── commands/           # Tauri commands
│   │   ├── models/             # Data structures
│   │   └── db/                 # Database migrations
│   └── tauri.conf.json
└── package.json
```

## Technologies

- **Frontend**: [Svelte 5](https://svelte.dev/) with TypeScript
- **Backend**: [Tauri 2.0](https://tauri.app/) (Rust)
- **Database**: SQLite via [tauri-plugin-sql](https://github.com/tauri-apps/plugins-workspace)
- **Build Tool**: [Vite](https://vitejs.dev/)

## License

MIT
