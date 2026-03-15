type LogLevel = "debug" | "info" | "warn" | "error";

function emit(level: LogLevel, scope: string, message: string, details?: unknown) {
  const prefix = `[mayhemtracker:${scope}] ${message}`;

  if (details === undefined) {
    console[level](prefix);
    return;
  }

  console[level](prefix, details);
}

export const logger = {
  debug: (scope: string, message: string, details?: unknown) => emit("debug", scope, message, details),
  info: (scope: string, message: string, details?: unknown) => emit("info", scope, message, details),
  warn: (scope: string, message: string, details?: unknown) => emit("warn", scope, message, details),
  error: (scope: string, message: string, details?: unknown) => emit("error", scope, message, details),
};