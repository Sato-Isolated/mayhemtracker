import fs from "node:fs";
import path from "node:path";
import { ensureRuntimeDirectories, paths } from "../config/paths.js";

function archiveExistingDatabase() {
  if (!fs.existsSync(paths.dbFile)) {
    return undefined;
  }

  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const archiveBase = path.join(paths.legacyDbDir, `mayhemtracker-legacy-${timestamp}.sqlite`);

  fs.renameSync(paths.dbFile, archiveBase);
  for (const suffix of ["-shm", "-wal"]) {
    const source = `${paths.dbFile}${suffix}`;
    if (fs.existsSync(source)) {
      fs.renameSync(source, `${archiveBase}${suffix}`);
    }
  }

  return archiveBase;
}

function removeActiveDatabaseFiles() {
  for (const suffix of ["", "-shm", "-wal"]) {
    const target = `${paths.dbFile}${suffix}`;
    if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
  }
}

ensureRuntimeDirectories();
const archivedTo = archiveExistingDatabase();
removeActiveDatabaseFiles();

console.log(JSON.stringify({ dbFile: paths.dbFile, archivedTo: archivedTo ?? null }, null, 2));
