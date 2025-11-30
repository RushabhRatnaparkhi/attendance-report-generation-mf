# Attendance Report System

Simple, easy-to-use Next.js app for viewing attendance and assignment reports.  
This README explains how to run the project, what it does now, and how to troubleshoot common issues. Language is kept simple.

---

## Table of contents
- Project summary
- Current features
- Tech stack
- Prerequisites
- Setup (install & run)
- How to use the app
- APIs (endpoints available now)
- Project structure (important files)
- Troubleshooting & tips
- Contributing
- License

---

## Project summary
This project provides a web UI to:
- view attendance and assignment records,
- see summary statistics,
- filter records by status,
- view charts for distribution,
- and download reports.

It is intended as a lightweight reporting frontend that fetches data from server APIs (e.g. `/api/report`).

---

## Current features
- Two report modes:
  - Attendance — shows present / late / absent / leave stats, chart, and a table of records.
  - Assignment — shows assignment records with a simple table and export.
- Summary statistics cards with counts (click a card to filter records).
- Charts (Chart.js) with data labels (plugin) to visualize attendance distribution.
- Table view with readable columns and simple styling.
- Download exports:
  - Attendance -> CSV
  - Assignment -> TXT (formatted)
- Upload link in the UI that points to `/upload` (upload page present).
- Loading, error and empty states handled in the UI.
- Responsive layout using Tailwind CSS.

---

## Tech stack
- Next.js (App Router, React, TypeScript)
- Tailwind CSS for styling
- Chart.js + react-chartjs-2 + chartjs-plugin-datalabels
- Fetch-based client → server calls (server APIs under `app/api/`)

---

## Prerequisites
- Node.js 18+ (recommended)
- npm (or pnpm/yarn)
- (Optional) DB or API backend — the frontend expects `/api/report` to provide report data. If you don't have a backend, the app can still run but reports will show error/empty states.

---

## Setup — install & run (local dev)
1. Open a terminal and go to project root:
```bash
cd "/home/rushabh/Desktop/attendance report generation/attendance-report-system"
```

2. Install dependencies:
```bash
npm install
```

3. Start the dev server:
```bash
npm run dev
# By default Next runs on http://localhost:3000
```

4. Open the Reports page in your browser:
```
http://localhost:3000/report
```

---

## How to use the app
- Select the report type at top: "Attendance" or "Assignment".
- In Attendance mode:
  - Summary cards show counts (total, present, late, absent, leave).
  - Click a summary card to filter the table to only that status.
  - Use chart buttons to change chart type (Pie/Bar/Line) if available.
  - Click "Download Report" to download the currently visible data as CSV.
- In Assignment mode:
  - View assignment records and download as a formatted TXT file.
- Use the "Upload New File" button to go to the upload page and add fresh data (if upload feature is active).

---

## APIs (server endpoints used by the app)
- GET /api/report?mode=attendance
  - Returns attendance report JSON (records, statistics).
- GET /api/report?mode=assignment
  - Returns assignment report JSON.

Note: API implementations live under `app/api/`. If `/api/report` is not implemented in your environment, the UI will show error messages.

---

## Project structure (important files)
- app/report/page.tsx — main report UI (statistics, charts, tables, filters).
- app/upload/ — upload UI (link from report).
- app/api/ — server routes used by the app (e.g. /api/report).
- lib/ — helper utilities (DB connections, parsers if present).
- db/sql/ — any SQL scripts (if your project uses a DB).
- scripts/ — helper scripts (worker, utilities if present).
- package.json — scripts and dependencies.
- tailwind.config.js & global styles — styling configuration.

---

## Troubleshooting & tips
- Blank charts or errors:
  - Ensure the Next server is running and `/api/report` returns JSON.
  - Check browser console and server terminal for error messages.
- Chart renders incorrectly:
  - Confirm Chart.js and chartjs-plugin-datalabels are installed.
  - Restart dev server after adding dependencies.
- `npm install` fails on native modules:
  - Ensure build tools are installed (build-essential, python).
- API errors:
  - Inspect server logs (terminal where `npm run dev` runs).
  - Use `curl` to check the API directly:
    ```bash
    curl "http://localhost:3000/api/report?mode=attendance"
    ```
- Tailwind classes not applied:
  - Make sure CSS build is running (Next dev handles this). Restart server if needed.

---

## Contributing
- Keep changes small and focused.
- Run `npm run dev` and test UI manually for behavior and regressions.
- Add unit tests for critical utilities if you add backend logic.
- If you add DB or worker features, update README with DB setup and run commands.

---

## License
This project uses the MIT License. Modify `LICENSE` file as needed.

---

If you want, I can:
- add an example of the exact shape of the `/api/report` JSON the UI expects, or
- create a short checklist to add a local mock API for development. Which do you prefer?
