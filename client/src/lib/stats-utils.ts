import type { MatchListItem } from "@/lib/types";

export interface DashboardOverview {
  trackedPlayerName: string;
  trackedPlayerPuuid?: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageDurationSeconds: number;
  averageKda: number;
  latestMatchAt?: number;
}

export interface SessionSnapshot {
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKda: number;
  windowStart?: number;
  lastPlayedAt?: number;
}

export interface StreakSnapshot {
  type: "win" | "loss" | "neutral";
  value: number;
}

export interface ActivityDay {
  key: string;
  label: string;
  matches: number;
  intensity: number;
}

export interface ChampionSnapshot {
  championId?: number;
  championName?: string;
  matches: number;
  wins: number;
  winRate: number;
  averageKda: number;
  averageDamage: number;
}

export interface AugmentSnapshot {
  augmentId: string;
  matches: number;
  wins: number;
  winRate: number;
}

export interface TrackedMatchSnapshot {
  match: MatchListItem;
  participant: MatchListItem["participants"][number];
}

export interface DashboardInsights {
  overview: DashboardOverview;
  recentSession: SessionSnapshot;
  streak: StreakSnapshot;
  activity: ActivityDay[];
  topChampions: ChampionSnapshot[];
  topAugments: AugmentSnapshot[];
  trackedMatches: TrackedMatchSnapshot[];
}

function inferTrackedPlayerPuuid(matches: MatchListItem[]) {
  const counts = new Map<string, number>();

  for (const match of matches) {
    for (const participant of match.participants) {
      if (!participant.puuid) {
        continue;
      }

      counts.set(participant.puuid, (counts.get(participant.puuid) ?? 0) + 1);
    }
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
}

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function buildTrackedMatches(matches: MatchListItem[], trackedPuuid?: string) {
  if (!trackedPuuid) {
    return [] as TrackedMatchSnapshot[];
  }

  return matches
    .map((match) => {
      const participant = match.participants.find((entry) => entry.puuid === trackedPuuid);
      return participant ? { match, participant } : undefined;
    })
    .filter((entry): entry is TrackedMatchSnapshot => Boolean(entry));
}

function computeAverageKda(rows: Array<MatchListItem["participants"][number]>) {
  if (!rows.length) {
    return 0;
  }

  const total = rows.reduce((sum, participant) => {
    const kills = participant.kills ?? 0;
    const assists = participant.assists ?? 0;
    const deaths = Math.max(participant.deaths ?? 0, 1);
    return sum + (kills + assists) / deaths;
  }, 0);

  return round(total / rows.length, 2);
}

function buildRecentSession(trackedMatches: TrackedMatchSnapshot[]): SessionSnapshot {
  if (!trackedMatches.length) {
    return { matches: 0, wins: 0, losses: 0, winRate: 0, averageKda: 0 };
  }

  const latestTimestamp = trackedMatches[0]?.match.gameCreation ?? trackedMatches[0]?.match.retrievedAt;
  const windowStart = latestTimestamp ? latestTimestamp - 24 * 60 * 60 * 1000 : undefined;
  const rows = trackedMatches.filter((entry) => {
    const timestamp = entry.match.gameCreation ?? entry.match.retrievedAt;
    return windowStart ? timestamp >= windowStart : true;
  });
  const wins = rows.filter((entry) => entry.participant.win).length;

  return {
    matches: rows.length,
    wins,
    losses: Math.max(rows.length - wins, 0),
    winRate: rows.length ? Math.round((wins / rows.length) * 100) : 0,
    averageKda: computeAverageKda(rows.map((entry) => entry.participant)),
    windowStart,
    lastPlayedAt: latestTimestamp,
  };
}

function buildStreak(trackedMatches: TrackedMatchSnapshot[]): StreakSnapshot {
  if (!trackedMatches.length) {
    return { type: "neutral", value: 0 };
  }

  const first = trackedMatches[0]?.participant.win;
  if (typeof first !== "boolean") {
    return { type: "neutral", value: 0 };
  }

  let value = 0;
  for (const row of trackedMatches) {
    if (row.participant.win !== first) {
      break;
    }
    value += 1;
  }

  return {
    type: first ? "win" : "loss",
    value,
  };
}

function buildActivity(trackedMatches: TrackedMatchSnapshot[], days = 365): ActivityDay[] {
  const counts = new Map<string, number>();

  for (const row of trackedMatches) {
    const timestamp = row.match.gameCreation ?? row.match.retrievedAt;
    if (!timestamp) {
      continue;
    }

    const date = new Date(timestamp);
    const key = date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date();
  const output: ActivityDay[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const matches = counts.get(key) ?? 0;
    output.push({
      key,
      label: date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" }),
      matches,
      intensity: Math.min(matches, 7),
    });
  }

  return output;
}

function buildTopChampions(trackedMatches: TrackedMatchSnapshot[], limit = 5): ChampionSnapshot[] {
  const byChampion = new Map<string, { championId?: number; championName?: string; matches: number; wins: number; kdaSum: number; damageSum: number }>();

  for (const row of trackedMatches) {
    const key = String(row.participant.championId ?? row.participant.championName ?? "unknown");
    const current = byChampion.get(key) ?? {
      championId: row.participant.championId,
      championName: row.participant.championName,
      matches: 0,
      wins: 0,
      kdaSum: 0,
      damageSum: 0,
    };
    const deaths = Math.max(row.participant.deaths ?? 0, 1);
    current.matches += 1;
    current.wins += row.participant.win ? 1 : 0;
    current.kdaSum += ((row.participant.kills ?? 0) + (row.participant.assists ?? 0)) / deaths;
    current.damageSum += row.participant.totalDamageDealt ?? 0;
    byChampion.set(key, current);
  }

  return [...byChampion.values()]
    .sort((left, right) => right.matches - left.matches || right.wins - left.wins)
    .slice(0, limit)
    .map((entry) => ({
      championId: entry.championId,
      championName: entry.championName,
      matches: entry.matches,
      wins: entry.wins,
      winRate: entry.matches ? Math.round((entry.wins / entry.matches) * 100) : 0,
      averageKda: round(entry.kdaSum / Math.max(entry.matches, 1), 2),
      averageDamage: Math.round(entry.damageSum / Math.max(entry.matches, 1)),
    }));
}

function buildTopAugments(trackedMatches: TrackedMatchSnapshot[], limit = 8): AugmentSnapshot[] {
  const byAugment = new Map<string, { matches: number; wins: number }>();

  for (const row of trackedMatches) {
    for (const augmentId of row.participant.augments) {
      const current = byAugment.get(augmentId) ?? { matches: 0, wins: 0 };
      current.matches += 1;
      current.wins += row.participant.win ? 1 : 0;
      byAugment.set(augmentId, current);
    }
  }

  return [...byAugment.entries()]
    .sort((left, right) => right[1].matches - left[1].matches || right[1].wins - left[1].wins)
    .slice(0, limit)
    .map(([augmentId, entry]) => ({
      augmentId,
      matches: entry.matches,
      wins: entry.wins,
      winRate: entry.matches ? Math.round((entry.wins / entry.matches) * 100) : 0,
    }));
}

export function buildDashboardOverview(matches: MatchListItem[]): DashboardOverview {
  if (!matches.length) {
    return {
      trackedPlayerName: "Unknown summoner",
      trackedPlayerPuuid: undefined,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageDurationSeconds: 0,
      averageKda: 0,
      latestMatchAt: undefined,
    };
  }

  const trackedPuuid = inferTrackedPlayerPuuid(matches);
  const trackedRows = buildTrackedMatches(matches, trackedPuuid).map((entry) => entry.participant);

  const playerName = trackedRows[0]?.summonerName ?? trackedRows[0]?.riotIdGameName ?? "Unknown summoner";
  const wins = trackedRows.filter((participant) => participant.win).length;
  const totalMatches = matches.length;
  const averageDurationSeconds = Math.round(
    matches.reduce((sum, match) => sum + (match.gameDuration ?? 0), 0) / Math.max(totalMatches, 1),
  );

  return {
    trackedPlayerName: playerName,
    trackedPlayerPuuid: trackedPuuid,
    totalMatches,
    wins,
    losses: Math.max(totalMatches - wins, 0),
    winRate: totalMatches ? Math.round((wins / totalMatches) * 100) : 0,
    averageDurationSeconds,
    averageKda: computeAverageKda(trackedRows),
    latestMatchAt: matches[0]?.gameCreation ?? matches[0]?.retrievedAt,
  };
}

export function formatCompactStat(value?: number): string {
  if (!value) {
    return "0";
  }

  if (value >= 1000) {
    return `${(Math.round((value / 1000) * 10) / 10).toLocaleString("en-US")}k`;
  }

  return value.toLocaleString("en-US");
}

export function formatKdaRatio(kills?: number, deaths?: number, assists?: number): number {
  const safeDeaths = deaths && deaths > 0 ? deaths : 1;
  return ((kills ?? 0) + (assists ?? 0)) / safeDeaths;
}

export function buildDashboardInsights(matches: MatchListItem[]): DashboardInsights {
  const overview = buildDashboardOverview(matches);
  const trackedMatches = buildTrackedMatches(matches, overview.trackedPlayerPuuid);

  return {
    overview,
    recentSession: buildRecentSession(trackedMatches),
    streak: buildStreak(trackedMatches),
    activity: buildActivity(trackedMatches),
    topChampions: buildTopChampions(trackedMatches),
    topAugments: buildTopAugments(trackedMatches),
    trackedMatches,
  };
}
