# Copilot Instructions — Mayhem Tracker

## Project

Mayhem Tracker is a local Windows application for tracking statistics for League of Legends ARAM Mayhem. It watches the local LoL client, syncs match data, and provides analytical dashboards.

## Technical Stack

| Layer | Technologies |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui (Radix UI) |
| Backend | Express 5, TypeScript, better-sqlite3, league-connect |
| Monorepo | pnpm workspaces (`client/`, `server/`) |
| Validation | Zod |

## Naming Conventions

Apply these conventions in this order: file and component naming first, then service/router/hook/type naming when introducing new symbols.

- **Files**: kebab-case (`dashboard-card.tsx`, `match-service.ts`)
- **React components**: PascalCase (`DashboardCard`, `AppShell`)
- **Props**: `{ComponentName}Props` (`DashboardCardProps`)
- **Services**: camelCase with `Service` suffix (`matchService`, `analyticsService`)
- **Express routers**: camelCase with `Router` suffix (`analyticsRouter`)
- **Hooks**: `useXxx` (`useTrackerAppData`, `useTrackerMatchData`)
- **Backend types**: PascalCase with `Entity` or `Dto` suffix (`MatchEntity`, `MatchListItemDto`)

## Architecture

### Frontend (`client/src/`)

```
components/
  ui/          → shadcn/ui primitives (Button, Card, Dialog…)
  features/    → Domain components (DashboardCard, ActivityHeatmap…)
  layout/      → Shell and error boundary
pages/         → Pages lazy-loaded via React.lazy + Suspense
state/         → React Context (TrackerDataProvider)
lib/           → API client, types, utilities
```

- **State**: React Context API only, no Redux/Zustand. Use the `AsyncState<T>` pattern with `runAction()`.
- **API client**: Typed native fetch in `lib/api.ts`, no axios.
- **Routing**: React Router DOM with code splitting per page.
- **Styles**: Tailwind utility classes, CVA for component variants, no CSS modules.
- **Errors**: When League client access, database operations, or local sync fail, log the error and surface a user-friendly message in the UI.

### Backend (`server/src/`)

```
routes/        → Express routers
services/      → Business logic
repositories/  → Data access (SQLite)
db/            → Schema and migrations
types/         → TypeScript interfaces
config/        → Configuration (storage paths)
```

- **Repository Pattern**: Repositories handle raw data access, services orchestrate business logic.
- **Database**: SQLite via better-sqlite3 (synchronous). Stored in `%USERPROFILE%/.mayhemtracker/`.

## Language

The user interface and comments are in **English**.

## Constraints

- Local-only application, no cloud backend and no external authentication.
- Windows target, the League of Legends client is detected through `league-connect`.
- Data is stored locally in SQLite.
- Use the existing shadcn/ui components in `components/ui/` whenever possible. Only create a new component when no suitable existing component meets the requirements.
- Prefer reusing existing utilities in `lib/utils.ts`, `lib/stats-utils.ts`, and `lib/tracker-utils.ts`.

## Commands

```bash
pnpm dev          # Client + server in parallel
pnpm build        # Production build
pnpm db:reset     # Reset the SQLite database
```
