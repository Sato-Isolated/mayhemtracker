import { spawn } from "node:child_process";

export interface PowerShellResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
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
}

export const systemService = new SystemService();
