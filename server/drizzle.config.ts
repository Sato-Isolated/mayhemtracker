import path from "node:path";
import os from "node:os";
import { defineConfig } from "drizzle-kit";

const storageRoot = process.env.MAYHEMTRACKER_STORAGE_DIR
  ? path.resolve(process.env.MAYHEMTRACKER_STORAGE_DIR)
  : path.join(os.homedir(), ".mayhemtracker");

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: path.join(storageRoot, "db", "mayhemtracker.sqlite"),
  },
});
