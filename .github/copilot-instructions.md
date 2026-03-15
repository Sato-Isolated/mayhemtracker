# Copilot Instructions — Mayhem Tracker

## Projet

Mayhem Tracker est une application locale (Windows) de suivi de statistiques pour le mode ARAM Mayhem de League of Legends. Elle surveille le client LoL local, synchronise les données de matchs et fournit des tableaux de bord analytiques.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui (Radix UI) |
| Backend | Express 5, TypeScript, better-sqlite3, league-connect |
| Monorepo | pnpm workspaces (`client/`, `server/`) |
| Validation | Zod |

## Conventions de nommage

- **Fichiers** : kebab-case (`dashboard-card.tsx`, `match-service.ts`)
- **Composants React** : PascalCase (`DashboardCard`, `AppShell`)
- **Props** : `{NomComposant}Props` (`DashboardCardProps`)
- **Services** : camelCase + suffixe `Service` (`matchService`, `analyticsService`)
- **Routers Express** : camelCase + suffixe `Router` (`analyticsRouter`)
- **Hooks** : `useXxx` (`useTrackerAppData`, `useTrackerMatchData`)
- **Types backend** : PascalCase + suffixe `Entity` ou `Dto` (`MatchEntity`, `MatchListItemDto`)

## Architecture

### Frontend (`client/src/`)

```
components/
  ui/          → Composants primitifs shadcn/ui (Button, Card, Dialog…)
  features/    → Composants métier (DashboardCard, ActivityHeatmap…)
  layout/      → Shell et error boundary
pages/         → Pages lazy-loaded via React.lazy + Suspense
state/         → React Context (TrackerDataProvider)
lib/           → API client, types, utilitaires
```

- **State** : React Context API uniquement (pas de Redux/Zustand). Pattern `AsyncState<T>` avec `runAction()`.
- **API client** : Fetch natif typé dans `lib/api.ts` (pas d'axios).
- **Routing** : React Router DOM avec code splitting par page.
- **Styles** : Classes utilitaires Tailwind, CVA pour les variantes de composants, pas de CSS modules.

### Backend (`server/src/`)

```
routes/        → Express routers
services/      → Logique métier
repositories/  → Accès données (SQLite)
db/            → Schéma et migrations
types/         → Interfaces TypeScript
config/        → Configuration (chemins de stockage)
```

- **Pattern Repository** : Les repositories gèrent l'accès brut aux données, les services orchestrent la logique métier.
- **Base de données** : SQLite via better-sqlite3 (synchrone). Stockage dans `%USERPROFILE%/.mayhemtracker/`.

## Langue

L'interface utilisateur et les commentaires sont en **français**.

## Contraintes

- Application **locale uniquement** — pas de backend cloud, pas d'authentification externe.
- Cible **Windows** — le client League of Legends est détecté via `league-connect`.
- Données stockées en **SQLite** localement.
- Utiliser les composants **shadcn/ui existants** dans `components/ui/` avant d'en créer de nouveaux.
- Privilégier la **réutilisation** des utilitaires existants (`lib/utils.ts`, `lib/stats-utils.ts`, `lib/tracker-utils.ts`).

## Commandes

```bash
pnpm dev          # Client + serveur en parallèle
pnpm build        # Build production
pnpm db:reset     # Reset la base SQLite
```
