import fs from "node:fs";
import { paths } from "../config/paths.js";

for (const suffix of ["", "-shm", "-wal"]) {
  const target = `${paths.dbFile}${suffix}`;
  if (fs.existsSync(target)) {
    fs.rmSync(target, { force: true });
  }
}

console.log(`Database removed: ${paths.dbFile}`);
