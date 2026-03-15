import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const appRoot = path.resolve(process.cwd());
const storageRoot = process.env.MAYHEMTRACKER_STORAGE_DIR
  ? path.resolve(process.env.MAYHEMTRACKER_STORAGE_DIR)
  : path.join(os.homedir(), ".mayhemtracker");

export const paths = {
  appRoot,
  storageRoot,
  dbDir: path.join(storageRoot, "db"),
  dbFile: path.join(storageRoot, "db", "mayhemtracker.sqlite"),
  cacheRoot: path.join(storageRoot, "cache"),
  iconCacheRoot: path.join(storageRoot, "cache", "icons"),
  staticDataRoot: path.join(storageRoot, "static-data"),
  tempRoot: path.join(storageRoot, "tmp"),
};

export function ensureRuntimeDirectories() {
  for (const target of [
    paths.storageRoot,
    paths.dbDir,
    paths.cacheRoot,
    paths.iconCacheRoot,
    paths.staticDataRoot,
    paths.tempRoot,
  ]) {
    fs.mkdirSync(target, { recursive: true });
  }
}
