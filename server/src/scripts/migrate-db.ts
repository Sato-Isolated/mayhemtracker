import { ensureRuntimeDirectories, paths } from "../config/paths.js";
import { runMigrations } from "../db/migrations.js";

ensureRuntimeDirectories();
runMigrations();

console.log(JSON.stringify({ dbFile: paths.dbFile, migrated: true }, null, 2));
