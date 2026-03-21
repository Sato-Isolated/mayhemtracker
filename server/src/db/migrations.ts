import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { paths } from "../config/paths.js";
import { db, getSqlite } from "./index.js";

const APP_TABLES = [
  "app_metadata",
  "app_settings",
  "match_participants",
  "match_teams",
  "matches",
  "player_ratings",
  "static_augments",
  "static_champions",
  "static_items",
  "sync_runs",
] as const;

type MigrationJournal = {
  entries: Array<{
    tag: string;
    when: number;
  }>;
};

function getMigrationsFolder() {
  return path.join(paths.appRoot, "drizzle");
}

function listExistingTables() {
  const sqlite = getSqlite();
  return new Set(
    (sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>)
      .map((row) => row.name),
  );
}

function readMigrationJournal(migrationsFolder: string) {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  if (!fs.existsSync(journalPath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(journalPath, "utf8")) as MigrationJournal;
}

function ensureMigrationBaseline(migrationsFolder: string) {
  const sqlite = getSqlite();
  const existingTables = listExistingTables();
  const hasAppTables = APP_TABLES.some((table) => existingTables.has(table));

  if (!hasAppTables) {
    return;
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  const appliedCount = sqlite.prepare("SELECT COUNT(*) AS total FROM __drizzle_migrations").get() as { total: number };
  if (appliedCount.total > 0) {
    return;
  }

  const journal = readMigrationJournal(migrationsFolder);
  if (!journal?.entries.length) {
    return;
  }

  const insertMigration = sqlite.prepare(
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
  );

  const tx = sqlite.transaction(() => {
    for (const entry of journal.entries) {
      const migrationPath = path.join(migrationsFolder, `${entry.tag}.sql`);
      const query = fs.readFileSync(migrationPath, "utf8");
      const hash = crypto.createHash("sha256").update(query).digest("hex");
      insertMigration.run(hash, entry.when);
    }
  });

  tx();
}

export function runMigrations() {
  const migrationsFolder = getMigrationsFolder();
  ensureMigrationBaseline(migrationsFolder);
  migrate(db, {
    migrationsFolder,
  });
}
