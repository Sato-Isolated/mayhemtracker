import { matchRepository } from "../repositories/matchRepository.js";
import { staticDataRepository } from "../repositories/staticDataRepository.js";
import type {
  AugmentStatsDto,
  ChampionStatsDto,
  DashboardAnalyticsDto,
  DashboardOverviewDto,
  MatchSpotlightDto,
  ProfileAnalyticsDto,
  SessionSnapshotDto,
  StreakSnapshotDto,
  TeammateStatsDto,
  TrendPointDto,
} from "../types/analytics.js";
import type { MatchListItemDto } from "../types/match.js";

type TrackedRow = {
  match: MatchListItemDto;
  participant: MatchListItemDto["participants"][number];
};

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function computeAverageKda(rows: Array<MatchListItemDto["participants"][number]>) {
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

function inferTrackedPlayerPuuid(matches: MatchListItemDto[]) {
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

function buildTrackedRows(matches: MatchListItemDto[], trackedPuuid?: string) {
  if (!trackedPuuid) {
    return [] as TrackedRow[];
  }

  return matches
    .map((match) => {
      const participant = match.participants.find((entry) => entry.puuid === trackedPuuid);
      return participant ? { match, participant } : undefined;
    })
    .filter((entry): entry is TrackedRow => Boolean(entry));
}

function buildOverview(matches: MatchListItemDto[]): DashboardOverviewDto {
  if (!matches.length) {
    return {
      trackedPlayerName: "Invocateur inconnu",
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageDurationSeconds: 0,
      averageKda: 0,
    };
  }

  const trackedPuuid = inferTrackedPlayerPuuid(matches);
  const trackedRows = buildTrackedRows(matches, trackedPuuid).map((entry) => entry.participant);
  const playerName = trackedRows[0]?.summonerName ?? trackedRows[0]?.riotIdGameName ?? "Invocateur inconnu";
  const wins = trackedRows.filter((participant) => participant.win).length;

  return {
    trackedPlayerName: playerName,
    trackedPlayerPuuid: trackedPuuid,
    totalMatches: trackedRows.length,
    wins,
    losses: Math.max(trackedRows.length - wins, 0),
    winRate: trackedRows.length ? Math.round((wins / trackedRows.length) * 100) : 0,
    averageDurationSeconds: Math.round(
      matches.reduce((sum, match) => sum + (match.gameDuration ?? 0), 0) / Math.max(matches.length, 1),
    ),
    averageKda: computeAverageKda(trackedRows),
    latestMatchAt: matches[0]?.gameCreation ?? matches[0]?.retrievedAt,
  };
}

function buildSession(rows: TrackedRow[]): SessionSnapshotDto {
  if (!rows.length) {
    return { matches: 0, wins: 0, losses: 0, winRate: 0, averageKda: 0 };
  }

  const latestTimestamp = rows[0]?.match.gameCreation ?? rows[0]?.match.retrievedAt;
  const windowStart = latestTimestamp ? latestTimestamp - 24 * 60 * 60 * 1000 : undefined;
  const windowRows = rows.filter((entry) => {
    const timestamp = entry.match.gameCreation ?? entry.match.retrievedAt;
    return windowStart ? timestamp >= windowStart : true;
  });
  const wins = windowRows.filter((entry) => entry.participant.win).length;

  return {
    matches: windowRows.length,
    wins,
    losses: Math.max(windowRows.length - wins, 0),
    winRate: windowRows.length ? Math.round((wins / windowRows.length) * 100) : 0,
    averageKda: computeAverageKda(windowRows.map((entry) => entry.participant)),
    windowStart,
    lastPlayedAt: latestTimestamp,
  };
}

function buildCurrentStreak(rows: TrackedRow[]): StreakSnapshotDto {
  if (!rows.length || typeof rows[0]?.participant.win !== "boolean") {
    return { type: "neutral", value: 0 };
  }

  const first = rows[0].participant.win;
  let value = 0;

  for (const row of rows) {
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

function buildBestStreak(rows: TrackedRow[], target: boolean) {
  let best = 0;
  let current = 0;

  for (const row of rows) {
    if (row.participant.win === target) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

function buildActivity(rows: TrackedRow[], days = 365) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const timestamp = row.match.gameCreation ?? row.match.retrievedAt;
    if (!timestamp) {
      continue;
    }

    const date = new Date(timestamp);
    const key = date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const max = Math.max(...counts.values(), 0);
  const today = new Date();
  const output = [] as DashboardAnalyticsDto["activity"];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const matches = counts.get(key) ?? 0;
    output.push({
      key,
      label: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      matches,
      intensity: max ? Math.max(1, Math.round((matches / max) * 4)) : 0,
    });
  }

  return output;
}

function buildTrend(rows: TrackedRow[], days = 14): TrendPointDto[] {
  const today = new Date();
  const buckets = new Map<string, { wins: number; matches: number; label: string }>();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      wins: 0,
      matches: 0,
      label: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    });
  }

  for (const row of rows) {
    const timestamp = row.match.gameCreation ?? row.match.retrievedAt;
    if (!timestamp) {
      continue;
    }

    const key = new Date(timestamp).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) {
      continue;
    }

    bucket.matches += 1;
    bucket.wins += row.participant.win ? 1 : 0;
  }

  return [...buckets.entries()].map(([key, value]) => ({
    key,
    label: value.label,
    matches: value.matches,
    wins: value.wins,
    winRate: value.matches ? Math.round((value.wins / value.matches) * 100) : 0,
  }));
}

function buildChampionStats(rows: TrackedRow[]): ChampionStatsDto[] {
  const byChampion = new Map<string, { championId?: number; championName?: string; matches: number; wins: number; kdaSum: number; damageSum: number; goldSum: number }>();

  for (const row of rows) {
    const key = String(row.participant.championId ?? row.participant.championName ?? "unknown");
    const current = byChampion.get(key) ?? {
      championId: row.participant.championId,
      championName: row.participant.championName,
      matches: 0,
      wins: 0,
      kdaSum: 0,
      damageSum: 0,
      goldSum: 0,
    };
    const deaths = Math.max(row.participant.deaths ?? 0, 1);
    current.matches += 1;
    current.wins += row.participant.win ? 1 : 0;
    current.kdaSum += ((row.participant.kills ?? 0) + (row.participant.assists ?? 0)) / deaths;
    current.damageSum += row.participant.totalDamageDealt ?? 0;
    current.goldSum += row.participant.goldEarned ?? 0;
    byChampion.set(key, current);
  }

  return [...byChampion.values()]
    .sort((left, right) => right.matches - left.matches || right.wins - left.wins)
    .map((entry) => ({
      championId: entry.championId,
      championName: entry.championName,
      matches: entry.matches,
      wins: entry.wins,
      losses: Math.max(entry.matches - entry.wins, 0),
      winRate: entry.matches ? Math.round((entry.wins / entry.matches) * 100) : 0,
      averageKda: round(entry.kdaSum / Math.max(entry.matches, 1), 2),
      averageDamage: Math.round(entry.damageSum / Math.max(entry.matches, 1)),
      averageGold: Math.round(entry.goldSum / Math.max(entry.matches, 1)),
    }));
}

function buildAugmentStats(rows: TrackedRow[]): AugmentStatsDto[] {
  const byAugment = new Map<string, { matches: number; wins: number }>();
  const staticAugments = staticDataRepository.listAugments();

  for (const row of rows) {
    for (const augmentId of row.participant.augments) {
      const current = byAugment.get(augmentId) ?? { matches: 0, wins: 0 };
      current.matches += 1;
      current.wins += row.participant.win ? 1 : 0;
      byAugment.set(augmentId, current);
    }
  }

  return [...byAugment.entries()]
    .sort((left, right) => right[1].matches - left[1].matches || right[1].wins - left[1].wins)
    .map(([augmentId, entry]) => {
      const augment = staticAugments.find((item) => item.id === augmentId);
      return {
        augmentId,
        matches: entry.matches,
        wins: entry.wins,
        winRate: entry.matches ? Math.round((entry.wins / entry.matches) * 100) : 0,
        rarity: augment?.rarity as string | undefined,
        label: augment?.name,
      };
    });
}

function buildTeammates(rows: TrackedRow[]): TeammateStatsDto[] {
  const trackedPuuid = rows[0]?.participant.puuid;
  if (!trackedPuuid) {
    return [];
  }

  const map = new Map<string, Omit<TeammateStatsDto, "winRateTogether">>();

  for (const row of rows) {
    const timestamp = row.match.gameCreation ?? row.match.retrievedAt;
    for (const participant of row.match.participants) {
      if (
        !participant.puuid ||
        participant.puuid === trackedPuuid ||
        participant.teamId !== row.participant.teamId
      ) {
        continue;
      }

      const current = map.get(participant.puuid) ?? {
        puuid: participant.puuid,
        summonerName: participant.summonerName ?? participant.riotIdGameName ?? "Joueur inconnu",
        matches: 0,
        winsTogether: 0,
        lossesTogether: 0,
        lastSeenAt: timestamp,
      };
      current.matches += 1;
      if (row.participant.win) {
        current.winsTogether += 1;
      } else {
        current.lossesTogether += 1;
      }
      current.lastSeenAt = Math.max(current.lastSeenAt ?? 0, timestamp ?? 0);
      map.set(participant.puuid, current);
    }
  }

  return [...map.values()]
    .sort((left, right) => right.matches - left.matches || (right.lastSeenAt ?? 0) - (left.lastSeenAt ?? 0))
    .map((entry) => ({
      ...entry,
      winRateTogether: entry.matches ? Math.round((entry.winsTogether / entry.matches) * 100) : 0,
    }));
}

export class AnalyticsService {
  private getMatches() {
    return matchRepository.listAllMatches();
  }

  getDashboard(): DashboardAnalyticsDto {
    const matches = this.getMatches();
    const overview = buildOverview(matches);
    const trackedRows = buildTrackedRows(matches, overview.trackedPlayerPuuid);

    return {
      overview,
      recentSession: buildSession(trackedRows),
      streak: buildCurrentStreak(trackedRows),
      activity: buildActivity(trackedRows),
      trend: buildTrend(trackedRows),
      topChampions: buildChampionStats(trackedRows).slice(0, 6),
      topAugments: buildAugmentStats(trackedRows).slice(0, 8),
      recentMatches: trackedRows.slice(0, 8).map((entry) => ({
        match: entry.match,
        participant: entry.participant,
      })) satisfies MatchSpotlightDto[],
    };
  }

  getProfile(): ProfileAnalyticsDto {
    const matches = this.getMatches();
    const overview = buildOverview(matches);
    const trackedRows = buildTrackedRows(matches, overview.trackedPlayerPuuid);

    const records = trackedRows.reduce(
      (accumulator, row) => ({
        highestKills: Math.max(accumulator.highestKills, row.participant.kills ?? 0),
        highestAssists: Math.max(accumulator.highestAssists, row.participant.assists ?? 0),
        highestDamage: Math.max(accumulator.highestDamage, row.participant.totalDamageDealt ?? 0),
        highestGold: Math.max(accumulator.highestGold, row.participant.goldEarned ?? 0),
        pentakills: accumulator.pentakills + (row.participant.pentaKills ?? 0),
      }),
      { highestKills: 0, highestAssists: 0, highestDamage: 0, highestGold: 0, pentakills: 0 },
    );

    return {
      overview,
      currentStreak: buildCurrentStreak(trackedRows),
      bestWinStreak: buildBestStreak([...trackedRows].reverse(), true),
      bestLossStreak: buildBestStreak([...trackedRows].reverse(), false),
      records,
    };
  }

  listChampionStats() {
    const matches = this.getMatches();
    const overview = buildOverview(matches);
    return buildChampionStats(buildTrackedRows(matches, overview.trackedPlayerPuuid));
  }

  listAugmentStats() {
    const matches = this.getMatches();
    const overview = buildOverview(matches);
    return buildAugmentStats(buildTrackedRows(matches, overview.trackedPlayerPuuid));
  }

  listTeammates() {
    const matches = this.getMatches();
    const overview = buildOverview(matches);
    return buildTeammates(buildTrackedRows(matches, overview.trackedPlayerPuuid));
  }
}

export const analyticsService = new AnalyticsService();