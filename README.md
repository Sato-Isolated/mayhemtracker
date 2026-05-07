# Mayhem Tracker

A local Windows web app for tracking League of Legends matches through the League client's local API. The frontend runs in the browser, the Node.js backend stays local, and data is stored in SQLite on the machine.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui
- Backend: Node.js, Express, TypeScript, `league-connect`
- Storage: SQLite with `better-sqlite3`
- Monorepo: pnpm workspaces

## Prerequisites

- Windows
- Node.js
- pnpm
- League of Legends client installed

## Installation

```bash
pnpm install
```

## Run

In development:

```bash
pnpm dev
```

Ou via le script Windows fourni:

```bat
start-mayhemtracker.bat
```

This starts:

- the Vite frontend on `http://localhost:5173`
- the Express backend on `http://localhost:3001`

The Vite proxy automatically routes `/api/*` and `/assets-cache/*` to the local backend.

## Useful scripts

```bash
pnpm dev
pnpm dev:client
pnpm dev:server
pnpm build
pnpm test
pnpm test:client
pnpm verify
pnpm db:reset
```

## Frontend tests

Tests use Vitest + Testing Library on the client side.

```bash
pnpm test:client
```

The currently covered scenarios validate:

- resetting preferences in `Settings`
- opening a detail view from an interactive table
- expanding the `history/detail` flow

## Local storage

By default, local data is written to:

```text
%USERPROFILE%/.mayhemtracker
```

Main contents:

- `db/mayhemtracker.sqlite`: persistent SQLite database
- `cache/icons/`: disk cache for champion, item, and augment icons
- `static-data/`: sync files and Riot metadata

You can override this folder with the `MAYHEMTRACKER_STORAGE_DIR` environment variable.

## Local backend endpoints

- `GET /api/status`
- `GET /api/league/connection`
- `GET /api/league/auth`
- `GET /api/league/summoner`
- `GET /api/league/gameflow`
- `GET /api/system/powershell-test`
- `POST /api/static-data/sync`
- `GET /api/static-data/champions`
- `GET /api/static-data/augments`
- `GET /api/static-data/items`
- `POST /api/matches/sync-current`
- `GET /api/matches`
- `GET /api/matches/:matchId`
- `DELETE /api/matches/clear`

## Integration notes

- The application is designed for local-only usage.
- `league-connect` is only used on the backend side.
- The frontend only calls local HTTP routes under `/api/...`.
- The backend also serves the local icon cache through `/assets-cache/...`.
- If the League client is not open, League routes return a clean JSON error.
