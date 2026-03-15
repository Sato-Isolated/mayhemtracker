# Mayhem Tracker

Scaffold local Windows avec frontend React dans le navigateur et backend Node.js local. Le backend encapsule `league-connect`, PowerShell, le stockage SQLite, la synchronisation Data Dragon / CommunityDragon et le cache disque des icônes.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, lucide-react, sonner, zod
- Backend: Node.js, Express, TypeScript, league-connect, PowerShell via `child_process`
- Stockage: SQLite avec `better-sqlite3`
- Monorepo: pnpm workspaces

## Structure

```text
.
├── client/
│   ├── components.json
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   └── lib/
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   └── types/
│   └── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Installation

```bash
pnpm install
```

## Lancement en développement

```bash
pnpm dev
```

Cela lance:

- le frontend Vite sur `http://localhost:5173`
- le backend Express sur `http://localhost:3001`

Le proxy Vite route automatiquement `/api/*` et `/assets-cache/*` vers le backend.

## Build

```bash
pnpm build
```

## Scripts utiles

```bash
pnpm dev
pnpm dev:client
pnpm dev:server
pnpm build
pnpm db:reset
pnpm test:e2e
pnpm test:e2e:ui
```

## Tests E2E Playwright

Le repo inclut un setup Playwright au niveau racine pour vérifier rapidement l'interface, en particulier le système de thèmes.

Installation des navigateurs:

```bash
pnpm exec playwright install chromium
```

Lancement des tests:

```bash
pnpm test:e2e
```

Le smoke test actuel:

- démarre le frontend Vite automatiquement
- mocke les routes `/api/*` nécessaires pour éviter une dépendance au backend local
- ouvre `/settings`
- change de thème
- vérifie `data-theme` sur le document root
- produit une capture dans les artifacts Playwright

## Stockage local

Par défaut, les données locales sont écrites dans:

```text
%USERPROFILE%/.mayhemtracker
```

Contenu principal:

- `db/mayhemtracker.sqlite`: base SQLite persistante
- `cache/icons/`: cache disque des icônes champions, items et augments
- `static-data/`: fichiers de sync et métadonnées Riot

Tu peux surcharger ce dossier avec la variable d’environnement `MAYHEMTRACKER_STORAGE_DIR`.

## Endpoints backend

- `GET /api/status`
- `GET /api/league/auth`
- `GET /api/league/summoner`
- `GET /api/system/powershell-test`
- `POST /api/static-data/sync`
- `GET /api/static-data/champions`
- `GET /api/static-data/augments`
- `GET /api/static-data/items`
- `POST /api/matches/sync-current`
- `GET /api/matches`
- `GET /api/matches/:matchId`
- `DELETE /api/matches/clear`

## Notes d’intégration

- `league-connect` n’est utilisé que côté backend.
- Le frontend appelle uniquement des routes HTTP locales `/api/...`.
- Le backend sert aussi le cache local des icônes via `/assets-cache/...`.
- Si le client League n’est pas ouvert, les routes League renverront une erreur JSON propre.
- Le mapping des données ARAM Mayhem dépend des payloads effectivement exposés par le client local, donc certains champs peuvent rester absents tant qu’ils n’ont pas été confirmés sur ta machine.
