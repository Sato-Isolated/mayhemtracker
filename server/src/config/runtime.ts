const DEFAULT_MATCH_HISTORY_PAGE_SIZE = 20;

function readIntEnv(name: string, fallback: number, { min = 1, max }: { min?: number; max?: number } = {}) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    return fallback;
  }

  return parsed;
}

export const runtimeConfig = {
  supportedQueueIds: new Set(
    (process.env.MAYHEMTRACKER_SUPPORTED_QUEUE_IDS ?? "2400")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0),
  ),
  leagueRequestTimeoutMs: readIntEnv("MAYHEMTRACKER_LEAGUE_TIMEOUT_MS", 4_000, { min: 500, max: 30_000 }),
  matchDetailConcurrency: readIntEnv("MAYHEMTRACKER_MATCH_DETAIL_CONCURRENCY", 4, { min: 1, max: 10 }),
  maxSyncMatches: readIntEnv("MAYHEMTRACKER_MAX_SYNC_MATCHES", DEFAULT_MATCH_HISTORY_PAGE_SIZE, { min: 1, max: 100 }),
  matchHistoryBegIndex: 0,
  matchHistoryEndIndex: readIntEnv("MAYHEMTRACKER_MATCH_HISTORY_END_INDEX", DEFAULT_MATCH_HISTORY_PAGE_SIZE - 1, {
    min: 0,
    max: 99,
  }),
} as const;
