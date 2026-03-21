import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { paths } from "../config/paths.js";
import { getSqlite } from "../db/index.js";
import { syncRepository } from "../repositories/syncRepository.js";
import { leagueService } from "./leagueService.js";

export interface PowerShellResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

function collectDirectoryStats(root: string): { files: number; directories: number; bytes: number } {
  if (!fs.existsSync(root)) {
    return { files: 0, directories: 0, bytes: 0 };
  }

  let files = 0;
  let directories = 0;
  let bytes = 0;
  const queue = [root];

  while (queue.length) {
    const current = queue.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) {
        directories += 1;
        queue.push(target);
      } else if (entry.isFile()) {
        files += 1;
        bytes += fs.statSync(target).size;
      }
    }
  }

  return { files, directories, bytes };
}

export class SystemService {
  async runPowerShellTest(): Promise<PowerShellResult> {
    return new Promise((resolve) => {
      const child = spawn(
        "powershell.exe",
        [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          "Get-Process LeagueClientUx -ErrorAction SilentlyContinue | Select-Object ProcessName,Id | ConvertTo-Json -Compress",
        ],
        {
          windowsHide: true,
        },
      );

      let stdout = "";
      let stderr = "";

      const timer = setTimeout(() => {
        child.kill();
      }, 5000);

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        resolve({
          ok: exitCode === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode,
        });
      });
    });
  }

  async getRuntimeDiagnostics() {
    const journalMode = getSqlite().pragma("journal_mode", { simple: true }) as string | undefined;
    const league = await leagueService.getConnectionStatus();
    const iconCache = collectDirectoryStats(paths.iconCacheRoot);

    return {
      storageRoot: paths.storageRoot,
      db: {
        path: paths.dbFile,
        exists: fs.existsSync(paths.dbFile),
        journalMode: journalMode ?? "unknown",
      },
      sync: syncRepository.getSyncStatus(),
      league,
      iconCache: {
        root: paths.iconCacheRoot,
        ...iconCache,
      },
    };
  }
}

export const systemService = new SystemService();
