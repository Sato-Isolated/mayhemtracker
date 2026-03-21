# Mayhem Tracker

Application web locale Windows pour suivre des parties League of Legends via l'API locale du client League. Le frontend tourne dans le navigateur, le backend Node.js reste local, et les données sont stockées dans SQLite sur la machine.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui
- Backend: Node.js, Express, TypeScript, `league-connect`
- Stockage: SQLite avec `better-sqlite3`
- Monorepo: pnpm workspaces

## Pré-requis

- Windows
- Node.js
- pnpm
- Client League of Legends installé

## Installation

```bash
pnpm install
```

## Lancement

En développement:

```bash
pnpm dev
```

Ou via le script Windows fourni:

```bat
start-mayhemtracker.bat
```

Cela lance:

- le frontend Vite sur `http://localhost:5173`
- le backend Express sur `http://localhost:3001`

Le proxy Vite route automatiquement `/api/*` et `/assets-cache/*` vers le backend local.

## Scripts utiles

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

## Tests frontend

Les tests utilisent Vitest + Testing Library côté client.

```bash
pnpm test:client
```

Les scénarios couverts actuellement valident:

- la réinitialisation des préférences dans `Settings`
- l'ouverture d'un détail depuis une table interactive
- l'expansion du flux `history/detail`

## Stockage local

Par défaut, les données locales sont écrites dans:

```text
%USERPROFILE%/.mayhemtracker
```

Contenu principal:

- `db/mayhemtracker.sqlite`: base SQLite persistante
- `cache/icons/`: cache disque des icônes champions, items et augments
- `static-data/`: fichiers de sync et métadonnées Riot

Tu peux surcharger ce dossier avec la variable d'environnement `MAYHEMTRACKER_STORAGE_DIR`.

## Endpoints backend locaux

- `GET /api/status`
- `GET /api/league/connection`
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

## Notes d'intégration

- L'application est pensée pour un usage local uniquement.
- `league-connect` n'est utilisé que côté backend.
- Le frontend appelle uniquement des routes HTTP locales `/api/...`.
- Le backend sert aussi le cache local des icônes via `/assets-cache/...`.
- Si le client League n'est pas ouvert, les routes League renvoient une erreur JSON propre.
