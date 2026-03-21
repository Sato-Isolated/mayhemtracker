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

type TrackedIdentity = {
  puuid: string;
  summonerName: string;
};

type TrackedMatch = {
  match: MatchListItemDto;
  participant: MatchListItemDto["participants"][number];
  playedAt: number;
};

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeAugmentRarity(rarity?: string | null) {
  if (!rarity) {
    return undefined;
  }

  const normalized = rarity.trim().toLowerCase();
  if (normalized === "ksilver") {
    return "silver";
  }
  if (normalized === "kgold") {
    return "gold";
  }
  if (normalized === "kprismatic") {
    return "prismatic";
  }
  if (normalized === "kbronze") {
    return "bronze";
  }

  return normalized.replace(/^k/, "");
}

function getTrackedIdentity() {
  const tracked = matchRepository.getTrackedPlayer();
  if (!tracked) {
    return undefined;
  }

  return {
    puuid: tracked.puuid,
    summonerName: tracked.summonerName,
  } satisfies TrackedIdentity;
}

function buildEmptyOverview(): DashboardOverviewDto {
  return {
    trackedPlayerName: "Unknown summoner",
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    averageDurationSeconds: 0,
    averageKda: 0,
  };
}

function getPlayedAt(match: MatchListItemDto) {
  return match.gameCreation ?? match.retrievedAt;
}

function getTrackedMatches(trackedPuuid: string) {
  return matchRepository.listAllMatches()
    .map((match) => {
      const participant = match.participants.find((entry) => entry.puuid === trackedPuuid);
      if (!participant) {
        return undefined;
      }

      return {
        match,
        participant,
        playedAt: getPlayedAt(match),
      } satisfies TrackedMatch;
    })
    .filter((entry): entry is TrackedMatch => Boolean(entry));
}

function buildOverview(tracked: TrackedIdentity | undefined, trackedMatches: TrackedMatch[]): DashboardOverviewDto {
  if (!tracked) {
    return buildEmptyOverview();
  }

  const totalMatches = trackedMatches.length;
  const wins = trackedMatches.filter((entry) => entry.participant.win).length;
  const totalDuration = trackedMatches.reduce((sum, entry) => sum + (entry.match.gameDuration ?? 0), 0);
  const totalKda = trackedMatches.reduce((sum, entry) => {
    const kills = entry.participant.kills ?? 0;
    const assists = entry.participant.assists ?? 0;
    const deaths = entry.participant.deaths ?? 0;
    return sum + (kills + assists) / Math.max(deaths, 1);
  }, 0);
  const latestMatchAt = trackedMatches.reduce((latest, entry) => Math.max(latest, entry.playedAt), 0) || undefined;

  return {
    trackedPlayerName: tracked.summonerName,
    trackedPlayerPuuid: tracked.puuid,
    totalMatches,
    wins,
    losses: Math.max(totalMatches - wins, 0),
    winRate: totalMatches ? Math.round((wins / totalMatches) * 100) : 0,
    averageDurationSeconds: totalMatches ? Math.round(totalDuration / totalMatches) : 0,
    averageKda: totalMatches ? round(totalKda / totalMatches, 2) : 0,
    latestMatchAt,
  };
}

function buildSession(trackedMatches: TrackedMatch[], latestMatchAt?: number): SessionSnapshotDto {
  if (!latestMatchAt) {
    return { matches: 0, wins: 0, losses: 0, winRate: 0, averageKda: 0 };
  }

  const windowStart = latestMatchAt - 24 * 60 * 60 * 1000;
  const recentMatches = trackedMatches.filter((entry) => entry.playedAt >= windowStart);
  const wins = recentMatches.filter((entry) => entry.participant.win).length;
  const totalKda = recentMatches.reduce((sum, entry) => {
    const kills = entry.participant.kills ?? 0;
    const assists = entry.participant.assists ?? 0;
    const deaths = entry.participant.deaths ?? 0;
    return sum + (kills + assists) / Math.max(deaths, 1);
  }, 0);

  return {
    matches: recentMatches.length,
    wins,
    losses: Math.max(recentMatches.length - wins, 0),
    winRate: recentMatches.length ? Math.round((wins / recentMatches.length) * 100) : 0,
    averageKda: recentMatches.length ? round(totalKda / recentMatches.length, 2) : 0,
    windowStart,
    lastPlayedAt: latestMatchAt,
  };
}

function buildCurrentStreak(trackedMatches: TrackedMatch[]): StreakSnapshotDto {
  if (!trackedMatches.length || trackedMatches[0].participant.win === undefined) {
    return { type: "neutral", value: 0 };
  }

  const first = Boolean(trackedMatches[0].participant.win);
  let value = 0;

  for (const entry of trackedMatches) {
    if (Boolean(entry.participant.win) !== first) {
      break;
    }
    value += 1;
  }

  return {
    type: first ? "win" : "loss",
    value,
  };
}

function buildBestStreak(trackedMatches: TrackedMatch[], target: boolean) {
  let best = 0;
  let current = 0;

  for (const entry of [...trackedMatches].reverse()) {
    if (Boolean(entry.participant.win) === target) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

function buildActivity(trackedMatches: TrackedMatch[], days = 365) {
  const counts = new Map<string, number>();
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;

  for (const entry of trackedMatches) {
    if (entry.playedAt < threshold) {
      continue;
    }

    const date = new Date(entry.playedAt);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const maxMatches = Math.max(...counts.values(), 0);
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
      intensity: maxMatches ? Math.max(1, Math.round((matches / maxMatches) * 4)) : 0,
    });
  }

  return output;
}

function buildTrend(trackedMatches: TrackedMatch[], days = 14): TrendPointDto[] {
  const buckets = new Map<string, { matches: number; wins: number }>();
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;

  for (const entry of trackedMatches) {
    if (entry.playedAt < threshold) {
      continue;
    }

    const date = new Date(entry.playedAt);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? { matches: 0, wins: 0 };
    bucket.matches += 1;
    if (entry.participant.win) {
      bucket.wins += 1;
    }
    buckets.set(key, bucket);
  }

  const today = new Date();
  const output = [] as TrendPointDto[];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    const matches = bucket?.matches ?? 0;
    const wins = bucket?.wins ?? 0;

    output.push({
      key,
      label: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      matches,
      wins,
      winRate: matches ? Math.round((wins / matches) * 100) : 0,
    });
  }

  return output;
}

function buildChampionStats(trackedMatches: TrackedMatch[]): ChampionStatsDto[] {
  const buckets = new Map<string, {
    championId?: number;
    championName?: string;
    matches: number;
    wins: number;
    totalKda: number;
    totalDamage: number;
    totalGold: number;
  }>();

  for (const entry of trackedMatches) {
    const key = String(entry.participant.championId ?? entry.participant.championName ?? "unknown");
    const bucket = buckets.get(key) ?? {
      championId: entry.participant.championId,
      championName: entry.participant.championName,
      matches: 0,
      wins: 0,
      totalKda: 0,
      totalDamage: 0,
      totalGold: 0,
    };

    const kills = entry.participant.kills ?? 0;
    const assists = entry.participant.assists ?? 0;
    const deaths = entry.participant.deaths ?? 0;

    bucket.matches += 1;
    bucket.wins += entry.participant.win ? 1 : 0;
    bucket.totalKda += (kills + assists) / Math.max(deaths, 1);
    bucket.totalDamage += entry.participant.totalDamageDealt ?? 0;
    bucket.totalGold += entry.participant.goldEarned ?? 0;
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .sort((left, right) => right.matches - left.matches || right.wins - left.wins)
    .map((row) => ({
      championId: row.championId,
      championName: row.championName,
      matches: row.matches,
      wins: row.wins,
      losses: Math.max(row.matches - row.wins, 0),
      winRate: row.matches ? Math.round((row.wins / row.matches) * 100) : 0,
      averageKda: row.matches ? round(row.totalKda / row.matches, 2) : 0,
      averageDamage: row.matches ? Math.round(row.totalDamage / row.matches) : 0,
      averageGold: row.matches ? Math.round(row.totalGold / row.matches) : 0,
    }));
}

function buildAugmentStats(trackedMatches: TrackedMatch[]): AugmentStatsDto[] {
  const buckets = new Map<string, { matches: number; wins: number }>();
  const augmentLookup = new Map(
    staticDataRepository.listAugments().map((augment) => [augment.id, augment]),
  );

  for (const entry of trackedMatches) {
    for (const augmentId of entry.participant.augments) {
      const bucket = buckets.get(augmentId) ?? { matches: 0, wins: 0 };
      bucket.matches += 1;
      bucket.wins += entry.participant.win ? 1 : 0;
      buckets.set(augmentId, bucket);
    }
  }

  return [...buckets.entries()]
    .map(([augmentId, stats]) => {
      const augment = augmentLookup.get(augmentId);
      return {
        augmentId,
        matches: stats.matches,
        wins: stats.wins,
        winRate: stats.matches ? Math.round((stats.wins / stats.matches) * 100) : 0,
        rarity: normalizeAugmentRarity(augment?.rarity),
        label: augment?.name ?? undefined,
      };
    })
    .sort((left, right) => right.matches - left.matches || right.wins - left.wins);
}

function buildTeammates(trackedMatches: TrackedMatch[], trackedPuuid: string): TeammateStatsDto[] {
  const teammates = new Map<string, {
    puuid: string;
    summonerName: string;
    matches: number;
    winsTogether: number;
    lossesTogether: number;
    lastSeenAt?: number;
  }>();

  for (const entry of trackedMatches) {
    for (const ally of entry.match.participants) {
      if (!ally.puuid || ally.puuid === trackedPuuid || ally.teamId !== entry.participant.teamId) {
        continue;
      }

      const current = teammates.get(ally.puuid) ?? {
        puuid: ally.puuid,
        summonerName: ally.summonerName ?? ally.riotIdGameName ?? "Unknown player",
        matches: 0,
        winsTogether: 0,
        lossesTogether: 0,
        lastSeenAt: undefined,
      };

      current.matches += 1;
      if (entry.participant.win) {
        current.winsTogether += 1;
      } else {
        current.lossesTogether += 1;
      }
      current.lastSeenAt = Math.max(current.lastSeenAt ?? 0, entry.playedAt);
      if (!current.summonerName || current.summonerName === "Unknown player") {
        current.summonerName = ally.summonerName ?? ally.riotIdGameName ?? current.summonerName;
      }
      teammates.set(ally.puuid, current);
    }
  }

  return [...teammates.values()]
    .sort((left, right) => right.matches - left.matches || (right.lastSeenAt ?? 0) - (left.lastSeenAt ?? 0))
    .map((row) => ({
      ...row,
      winRateTogether: row.matches ? Math.round((row.winsTogether / row.matches) * 100) : 0,
    }));
}

function buildRecentMatches(trackedMatches: TrackedMatch[], limit: number) {
  return trackedMatches
    .slice(0, limit)
    .map((entry) => ({ match: entry.match, participant: entry.participant }))
    .filter((entry): entry is MatchSpotlightDto => Boolean(entry.participant));
}

function buildRecords(trackedMatches: TrackedMatch[]) {
  return trackedMatches.reduce(
    (records, entry) => ({
      highestKills: Math.max(records.highestKills, entry.participant.kills ?? 0),
      highestAssists: Math.max(records.highestAssists, entry.participant.assists ?? 0),
      highestDamage: Math.max(records.highestDamage, entry.participant.totalDamageDealt ?? 0),
      highestGold: Math.max(records.highestGold, entry.participant.goldEarned ?? 0),
      pentakills: records.pentakills + (entry.participant.pentaKills ?? 0),
    }),
    {
      highestKills: 0,
      highestAssists: 0,
      highestDamage: 0,
      highestGold: 0,
      pentakills: 0,
    },
  );
}

export class AnalyticsService {
  getDashboard(): DashboardAnalyticsDto {
    const tracked = getTrackedIdentity();
    const trackedMatches = tracked ? getTrackedMatches(tracked.puuid) : [];
    const overview = buildOverview(tracked, trackedMatches);

    if (!tracked) {
      return {
        overview,
        recentSession: { matches: 0, wins: 0, losses: 0, winRate: 0, averageKda: 0 },
        streak: { type: "neutral", value: 0 },
        activity: [],
        trend: [],
        topChampions: [],
        topAugments: [],
        recentMatches: [],
      };
    }

    return {
      overview,
      recentSession: buildSession(trackedMatches, overview.latestMatchAt),
      streak: buildCurrentStreak(trackedMatches),
      activity: buildActivity(trackedMatches),
      trend: buildTrend(trackedMatches),
      topChampions: buildChampionStats(trackedMatches).slice(0, 6),
      topAugments: buildAugmentStats(trackedMatches).slice(0, 8),
      recentMatches: buildRecentMatches(trackedMatches, 8),
    };
  }

  getProfile(): ProfileAnalyticsDto {
    const tracked = getTrackedIdentity();
    const trackedMatches = tracked ? getTrackedMatches(tracked.puuid) : [];
    const overview = buildOverview(tracked, trackedMatches);

    if (!tracked) {
      return {
        overview,
        currentStreak: { type: "neutral", value: 0 },
        bestWinStreak: 0,
        bestLossStreak: 0,
        records: {
          highestKills: 0,
          highestAssists: 0,
          highestDamage: 0,
          highestGold: 0,
          pentakills: 0,
        },
      };
    }

    return {
      overview,
      currentStreak: buildCurrentStreak(trackedMatches),
      bestWinStreak: buildBestStreak(trackedMatches, true),
      bestLossStreak: buildBestStreak(trackedMatches, false),
      records: buildRecords(trackedMatches),
    };
  }

  listChampionStats() {
    const tracked = getTrackedIdentity();
    return tracked ? buildChampionStats(getTrackedMatches(tracked.puuid)) : [];
  }

  listAugmentStats() {
    const tracked = getTrackedIdentity();
    return tracked ? buildAugmentStats(getTrackedMatches(tracked.puuid)) : [];
  }

  listTeammates() {
    const tracked = getTrackedIdentity();
    return tracked ? buildTeammates(getTrackedMatches(tracked.puuid), tracked.puuid) : [];
  }
}

export const analyticsService = new AnalyticsService();
