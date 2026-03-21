import Database from "better-sqlite3";
import { ensureRuntimeDirectories, paths } from "../config/paths.js";

ensureRuntimeDirectories();

const database = new Database(paths.dbFile);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.pragma("busy_timeout = 5000");

export function getDb() {
  return database;
}
