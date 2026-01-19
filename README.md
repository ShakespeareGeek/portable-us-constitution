# Portable US Constitution PWA

A fast, offline-first Progressive Web App (PWA) for browsing the United States Constitution. Built with React, TypeScript, and Vite, this application is designed to provide instant access to the Articles and Amendments, even without an internet connection.

## Features

-   **Offline-First:** Fully functional without an internet connection once loaded.
-   **Mobile Optimized:** Designed for a great experience on mobile devices (installable to home screen).
-   **Full-Text Search:** Instant client-side search across all text.
-   **Personalization:**
    -   **Bookmarks:** Save sections for quick access.
    -   **Notes:** Add private notes to any section.
    -   **Settings:** Toggle Light/Dark/System theme and adjust font size.
-   **Privacy Focused:** All data (notes, bookmarks, settings) is stored locally on your device using `localStorage` and IndexedDB. No data is ever sent to a server.

## Configuration

This project allows you to configure the URL prefix (base path) if you are deploying it to a subdirectory (e.g., `https://example.com/constitution/`).

1.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` and set the `VITE_BASE_PATH` variable:
    ```ini
    # For root deployment (e.g. https://example.com/)
    VITE_BASE_PATH=/

    # For subdirectory deployment (e.g. https://example.com/constitution/)
    VITE_BASE_PATH=/constitution/
    ```

## Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```

## Building for Production

To create an optimized production build:

```bash
npm run build
```

This will generate a `dist/` directory containing the compiled application.

## Deployment

### Deploying alongside an existing website

This application is designed to be easily "dropped in" to an existing website structure.

1.  **Configure:** Ensure your `.env` file's `VITE_BASE_PATH` matches the subdirectory you intend to use (e.g., `/constitution/`).
2.  **Build:** Run `npm run build`.
3.  **Deploy:** Upload the contents of the `dist/` directory to the corresponding folder on your web server.

**Example:**
If your website is `example.com` and you want the app at `example.com/constitution/`:
1.  Set `VITE_BASE_PATH=/constitution/` in `.env`.
2.  Build the project.
3.  Create a folder named `constitution` in your web server's public root.
4.  Copy all files from `dist/*` into that `constitution` folder.

The app is a Single Page Application (SPA), but since it uses Hash-based routing or simple state-based views (in this specific implementation), standard static file hosting usually works without complex server configuration for rewrites, provided the `base` path is correct.

## Tech Stack

-   **Framework:** React + TypeScript + Vite
-   **Styling:** Tailwind CSS
-   **Search:** FlexSearch
-   **Database:** Dexie.js (IndexedDB)
-   **PWA:** vite-plugin-pwa
