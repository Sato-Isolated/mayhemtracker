type LogLevel = "debug" | "info" | "warn" | "error";

function write(level: LogLevel, scope: string, message: string, details?: unknown) {
  const prefix = `[mayhemtracker:${scope}] ${message}`;

  if (details === undefined) {
    console[level](prefix);
    return;
  }

  console[level](prefix, details);
}

export const debugLog = {
  debug: (scope: string, message: string, details?: unknown) => write("debug", scope, message, details),
  info: (scope: string, message: string, details?: unknown) => write("info", scope, message, details),
  warn: (scope: string, message: string, details?: unknown) => write("warn", scope, message, details),
  error: (scope: string, message: string, details?: unknown) => write("error", scope, message, details),
};