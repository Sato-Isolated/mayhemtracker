import { getDb } from "../db/index.js";
import { matchRepository } from "../repositories/matchRepository.js";
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

const db = getDb();

type TrackedIdentity = {
  puuid: string;
  summonerName: string;
};

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
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

function buildOverview(tracked: TrackedIdentity | undefined): DashboardOverviewDto {
  if (!tracked) {
    return buildEmptyOverview();
  }

  const row = db.prepare(`
    SELECT
      COUNT(*) AS total_matches,
      SUM(CASE WHEN mp.win = 1 THEN 1 ELSE 0 END) AS wins,
      AVG(COALESCE(m.game_duration, 0)) AS average_duration_seconds,
      AVG(
        (COALESCE(mp.kills, 0) + COALESCE(mp.assists, 0)) * 1.0
        / CASE WHEN COALESCE(mp.deaths, 0) = 0 THEN 1 ELSE mp.deaths END
      ) AS average_kda,
      MAX(COALESCE(m.game_creation, m.retrieved_at)) AS latest_match_at
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = ?
  `).get(tracked.puuid) as {
    total_matches?: number;
    wins?: number;
    average_duration_seconds?: number;
    average_kda?: number;
    latest_match_at?: number;
  };

  const totalMatches = row.total_matches ?? 0;
  const wins = row.wins ?? 0;

  return {
    trackedPlayerName: tracked.summonerName,
    trackedPlayerPuuid: tracked.puuid,
    totalMatches,
    wins,
    losses: Math.max(totalMatches - wins, 0),
    winRate: totalMatches ? Math.round((wins / totalMatches) * 100) : 0,
    averageDurationSeconds: Math.round(row.average_duration_seconds ?? 0),
    averageKda: round(row.average_kda ?? 0, 2),
    latestMatchAt: row.latest_match_at,
  };
}

function buildSession(trackedPuuid: string, latestMatchAt?: number): SessionSnapshotDto {
  if (!latestMatchAt) {
    return { matches: 0, wins: 0, losses: 0, winRate: 0, averageKda: 0 };
  }

  const windowStart = latestMatchAt - 24 * 60 * 60 * 1000;
  const row = db.prepare(`
    SELECT
      COUNT(*) AS matches,
      SUM(CASE WHEN mp.win = 1 THEN 1 ELSE 0 END) AS wins,
      AVG(
        (COALESCE(mp.kills, 0) + COALESCE(mp.assists, 0)) * 1.0
        / CASE WHEN COALESCE(mp.deaths, 0) = 0 THEN 1 ELSE mp.deaths END
      ) AS average_kda
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = ?
      AND COALESCE(m.game_creation, m.retrieved_at) >= ?
  `).get(trackedPuuid, windowStart) as { matches?: number; wins?: number; average_kda?: number };

  const matches = row.matches ?? 0;
  const wins = row.wins ?? 0;

  return {
    matches,
    wins,
    losses: Math.max(matches - wins, 0),
    winRate: matches ? Math.round((wins / matches) * 100) : 0,
    averageKda: round(row.average_kda ?? 0, 2),
    windowStart,
    lastPlayedAt: latestMatchAt,
  };
}

function buildCurrentStreak(trackedPuuid: string): StreakSnapshotDto {
  const rows = db.prepare(`
    SELECT mp.win
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = ?
    ORDER BY COALESCE(m.game_creation, m.retrieved_at) DESC
    LIMIT 100
  `).all(trackedPuuid) as Array<{ win: number | null }>;

  if (!rows.length || rows[0].win === null) {
    return { type: "neutral", value: 0 };
  }

  const first = Boolean(rows[0].win);
  let value = 0;

  for (const row of rows) {
    if (Boolean(row.win) !== first) {
      break;
    }
    value += 1;
  }

  return {
    type: first ? "win" : "loss",
    value,
  };
}

function buildBestStreak(trackedPuuid: string, target: boolean) {
  const rows = db.prepare(`
    SELECT mp.win
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = ?
    ORDER BY COALESCE(m.game_creation, m.retrieved_at) ASC
  `).all(trackedPuuid) as Array<{ win: number | null }>;

  let best = 0;
  let current = 0;

  for (const row of rows) {
    if (Boolean(row.win) === target) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

function buildActivity(trackedPuuid: string, days = 365) {
  const rows = db.prepare(`
    SELECT
      DATE(COALESCE(m.game_creation, m.retrieved_at) / 1000, 'unixepoch') AS day_key,
      COUNT(*) AS matches
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = ?
      AND COALESCE(m.game_creation, m.retrieved_at) >= ?
    GROUP BY day_key
    ORDER BY day_key ASC
  `).all(trackedPuuid, Date.now() - days * 24 * 60 * 60 * 1000) as Array<{ day_key: string; matches: number }>;

  const counts = new Map(rows.map((row) => [row.day_key, row.matches]));
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

function buildTrend(trackedPuuid: string, days = 14): TrendPointDto[] {
  const rows = db.prepare(`
    SELECT
      DATE(COALESCE(m.game_creation, m.retrieved_at) / 1000, 'unixepoch') AS day_key,
      COUNT(*) AS matches,
      SUM(CASE WHEN mp.win = 1 THEN 1 ELSE 0 END) AS wins
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = ?
      AND COALESCE(m.game_creation, m.retrieved_at) >= ?
    GROUP BY day_key
    ORDER BY day_key ASC
  `).all(trackedPuuid, Date.now() - days * 24 * 60 * 60 * 1000) as Array<{ day_key: string; matches: number; wins: number }>;

  const buckets = new Map(rows.map((row) => [row.day_key, row]));
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

function buildChampionStats(trackedPuuid: string): ChampionStatsDto[] {
  const rows = db.prepare(`
    SELECT
      mp.champion_id AS championId,
      mp.champion_name AS championName,
      COUNT(*) AS matches,
      SUM(CASE WHEN mp.win = 1 THEN 1 ELSE 0 END) AS wins,
      AVG(
        (COALESCE(mp.kills, 0) + COALESCE(mp.assists, 0)) * 1.0
        / CASE WHEN COALESCE(mp.deaths, 0) = 0 THEN 1 ELSE mp.deaths END
      ) AS averageKda,
      AVG(COALESCE(mp.total_damage_dealt, 0)) AS averageDamage,
      AVG(COALESCE(mp.gold_earned, 0)) AS averageGold
    FROM match_participants mp
    WHERE mp.puuid = ?
    GROUP BY mp.champion_id, mp.champion_name
    ORDER BY matches DESC, wins DESC
  `).all(trackedPuuid) as Array<{
    championId?: number;
    championName?: string;
    matches: number;
    wins: number;
    averageKda: number;
    averageDamage: number;
    averageGold: number;
  }>;

  return rows.map((row) => ({
    championId: row.championId,
    championName: row.championName,
    matches: row.matches,
    wins: row.wins,
    losses: Math.max(row.matches - row.wins, 0),
    winRate: row.matches ? Math.round((row.wins / row.matches) * 100) : 0,
    averageKda: round(row.averageKda ?? 0, 2),
    averageDamage: Math.round(row.averageDamage ?? 0),
    averageGold: Math.round(row.averageGold ?? 0),
  }));
}

function buildAugmentStats(trackedPuuid: string): AugmentStatsDto[] {
  const rows = db.prepare(`
    SELECT
      augment_values.value AS augmentId,
      COUNT(*) AS matches,
      SUM(CASE WHEN mp.win = 1 THEN 1 ELSE 0 END) AS wins,
      sa.rarity AS rarity,
      sa.name AS label
    FROM match_participants mp
    JOIN json_each(mp.augments_json) AS augment_values ON 1 = 1
    LEFT JOIN static_augments sa ON sa.id = augment_values.value
    WHERE mp.puuid = ?
    GROUP BY augment_values.value, sa.rarity, sa.name
    ORDER BY matches DESC, wins DESC
  `).all(trackedPuuid) as Array<{ augmentId: string; matches: number; wins: number; rarity?: string; label?: string }>;

  return rows.map((row) => ({
    augmentId: row.augmentId,
    matches: row.matches,
    wins: row.wins,
    winRate: row.matches ? Math.round((row.wins / row.matches) * 100) : 0,
    rarity: row.rarity,
    label: row.label,
  }));
}

function buildTeammates(trackedPuuid: string): TeammateStatsDto[] {
  const rows = db.prepare(`
    WITH tracked_matches AS (
      SELECT match_id, team_id, win
      FROM match_participants
      WHERE puuid = @trackedPuuid
    )
    SELECT
      ally.puuid AS puuid,
      COALESCE(MAX(NULLIF(ally.summoner_name, '')), MAX(NULLIF(ally.riot_id_game_name, '')), 'Unknown player') AS summonerName,
      COUNT(*) AS matches,
      SUM(CASE WHEN tracked_matches.win = 1 THEN 1 ELSE 0 END) AS winsTogether,
      SUM(CASE WHEN tracked_matches.win = 1 THEN 0 ELSE 1 END) AS lossesTogether,
      MAX(COALESCE(m.game_creation, m.retrieved_at)) AS lastSeenAt
    FROM tracked_matches
    JOIN match_participants ally
      ON ally.match_id = tracked_matches.match_id
     AND ally.team_id = tracked_matches.team_id
    JOIN matches m ON m.match_id = tracked_matches.match_id
    WHERE ally.puuid IS NOT NULL
      AND ally.puuid <> @trackedPuuid
    GROUP BY ally.puuid
    ORDER BY matches DESC, lastSeenAt DESC
  `).all({ trackedPuuid }) as Array<{
    puuid: string;
    summonerName: string;
    matches: number;
    winsTogether: number;
    lossesTogether: number;
    lastSeenAt?: number;
  }>;

  return rows.map((row) => ({
    ...row,
    winRateTogether: row.matches ? Math.round((row.winsTogether / row.matches) * 100) : 0,
  }));
}

function buildRecentMatches(trackedPuuid: string, limit: number) {
  return matchRepository.listRecentTrackedMatches(trackedPuuid, limit)
    .map((match) => {
      const participant = match.participants.find((entry) => entry.puuid === trackedPuuid);
      return participant ? { match, participant } : undefined;
    })
    .filter((entry): entry is MatchSpotlightDto => Boolean(entry));
}

function buildRecords(trackedPuuid: string) {
  const row = db.prepare(`
    SELECT
      MAX(COALESCE(kills, 0)) AS highestKills,
      MAX(COALESCE(assists, 0)) AS highestAssists,
      MAX(COALESCE(total_damage_dealt, 0)) AS highestDamage,
      MAX(COALESCE(gold_earned, 0)) AS highestGold,
      SUM(COALESCE(penta_kills, 0)) AS pentakills
    FROM match_participants
    WHERE puuid = ?
  `).get(trackedPuuid) as {
    highestKills?: number;
    highestAssists?: number;
    highestDamage?: number;
    highestGold?: number;
    pentakills?: number;
  };

  return {
    highestKills: row.highestKills ?? 0,
    highestAssists: row.highestAssists ?? 0,
    highestDamage: row.highestDamage ?? 0,
    highestGold: row.highestGold ?? 0,
    pentakills: row.pentakills ?? 0,
  };
}

export class AnalyticsService {
  getDashboard(): DashboardAnalyticsDto {
    const tracked = getTrackedIdentity();
    const overview = buildOverview(tracked);

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
      recentSession: buildSession(tracked.puuid, overview.latestMatchAt),
      streak: buildCurrentStreak(tracked.puuid),
      activity: buildActivity(tracked.puuid),
      trend: buildTrend(tracked.puuid),
      topChampions: buildChampionStats(tracked.puuid).slice(0, 6),
      topAugments: buildAugmentStats(tracked.puuid).slice(0, 8),
      recentMatches: buildRecentMatches(tracked.puuid, 8),
    };
  }

  getProfile(): ProfileAnalyticsDto {
    const tracked = getTrackedIdentity();
    const overview = buildOverview(tracked);

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
      currentStreak: buildCurrentStreak(tracked.puuid),
      bestWinStreak: buildBestStreak(tracked.puuid, true),
      bestLossStreak: buildBestStreak(tracked.puuid, false),
      records: buildRecords(tracked.puuid),
    };
  }

  listChampionStats() {
    const tracked = getTrackedIdentity();
    return tracked ? buildChampionStats(tracked.puuid) : [];
  }

  listAugmentStats() {
    const tracked = getTrackedIdentity();
    return tracked ? buildAugmentStats(tracked.puuid) : [];
  }

  listTeammates() {
    const tracked = getTrackedIdentity();
    return tracked ? buildTeammates(tracked.puuid) : [];
  }
}

export const analyticsService = new AnalyticsService();
