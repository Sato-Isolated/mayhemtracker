import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { db } from "../db/index.js";
import { ensureRuntimeDirectories, paths } from "../config/paths.js";
import { runMigrations } from "../db/migrations.js";
import {
  appMetadata,
  appSettings,
  playerRatings,
  staticAugments,
  staticChampions,
  staticItems,
  syncRuns,
} from "../db/schema.js";
import { matchRepository } from "../repositories/matchRepository.js";
import type { MatchEntity } from "../types/match.js";

type SqliteDatabase = InstanceType<typeof Database>;

type CurrentMatchRow = {
  match_id: string;
  queue_id: number | null;
  game_mode: string | null;
  game_version: string | null;
  game_mode_mutators_json: string;
  map_id: number | null;
  game_creation: number | null;
  game_start_timestamp: number | null;
  game_end_timestamp: number | null;
  game_duration: number | null;
  retrieved_at: number;
  summary: string;
  raw_payload: string;
};

type CurrentParticipantRow = {
  match_id: string;
  participant_index: number;
  participant_id: number | null;
  puuid: string | null;
  riot_id_game_name: string | null;
  riot_id_tagline: string | null;
  summoner_name: string | null;
  team_id: number | null;
  champion_id: number | null;
  champion_name: string | null;
  spell1_id: number | null;
  spell2_id: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  double_kills: number | null;
  triple_kills: number | null;
  quadra_kills: number | null;
  penta_kills: number | null;
  total_damage_dealt: number | null;
  total_damage_taken: number | null;
  gold_earned: number | null;
  total_heal: number | null;
  total_cs: number | null;
  champion_level: number | null;
  vision_score: number | null;
  time_cc_others: number | null;
  largest_killing_spree: number | null;
  damage_to_turrets: number | null;
  win: number | null;
  placement: number | null;
  items_json: string;
  augments_json: string;
  perks_json: string;
  stats_json: string;
  raw_payload: string;
};

type CurrentTeamRow = {
  match_id: string;
  team_id: number;
  win: number | null;
  objectives_json: string;
  raw_payload: string;
};

type LegacyGameRow = {
  game_id: number;
  queue_id: number | null;
  game_mode: string | null;
  game_creation: number | null;
  game_duration: number | null;
  raw_json: string | null;
};

type LegacyParticipantRow = {
  game_id: number;
  participant_index: number;
  puuid: string | null;
  summoner_name: string | null;
  tag_line: string | null;
  champion_id: number | null;
  team_id: number | null;
  win: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  total_damage_dealt: number | null;
  total_damage_taken: number | null;
  gold_earned: number | null;
  total_heal: number | null;
  augment1: number | null;
  augment2: number | null;
  augment3: number | null;
  augment4: number | null;
  total_cs: number | null;
  champion_level: number | null;
  item0: number | null;
  item1: number | null;
  item2: number | null;
  item3: number | null;
  item4: number | null;
  item5: number | null;
};

type SourceRatingRow = {
  target_puuid?: string | null;
  puuid?: string | null;
  summoner_name?: string | null;
  rating?: number | null;
  note?: string | null;
  updated_at?: number | null;
};

type SourceSettingRow = {
  key: string;
  value: string;
  updated_at: number;
};

type SourceMetadataRow = {
  key: string;
  value: string;
  updated_at: number;
};

type SourceSyncRunRow = {
  id: string;
  status: string;
  started_at: number;
  finished_at: number | null;
  stored: number | null;
  updated: number | null;
  skipped: number | null;
  error_code: string | null;
  error_message: string | null;
};

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "Win" || value === 1) {
    return true;
  }
  if (value === "Fail" || value === 0) {
    return false;
  }
  return undefined;
}

function normalizeItemIds(source: Record<string, unknown>) {
  return [0, 1, 2, 3, 4, 5, 6]
    .map((slot) => source[`item${slot}`])
    .filter((value) => typeof value === "number" && value > 0)
    .map((value) => String(value));
}

function normalizeAugmentIds(source: Record<string, unknown>) {
  const candidates = [
    source.playerAugment1,
    source.playerAugment2,
    source.playerAugment3,
    source.playerAugment4,
    source.playerAugment5,
    source.playerAugment6,
    source.augment1,
    source.augment2,
    source.augment3,
    source.augment4,
    source.augments,
    source.perks,
  ];

  return candidates.flatMap((value) => {
    if (Array.isArray(value)) {
      return value
        .filter((entry) => typeof entry === "string" || typeof entry === "number")
        .map((entry) => String(entry))
        .filter((entry) => entry !== "0");
    }
    if (value && typeof value === "object") {
      return Object.values(value)
        .filter((entry) => typeof entry === "string" || typeof entry === "number")
        .map((entry) => String(entry))
        .filter((entry) => entry !== "0");
    }
    if ((typeof value === "string" || typeof value === "number") && value) {
      return [String(value)].filter((entry) => entry !== "0");
    }
    return [];
  });
}

function normalizePerkIds(entry: Record<string, unknown>, stats: Record<string, unknown>) {
  if (Array.isArray(entry.perks)) {
    return entry.perks
      .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
      .map((value) => String(value));
  }

  const candidates = [
    stats.perkPrimaryStyle,
    stats.perkSubStyle,
    stats.perk0,
    stats.perk1,
    stats.perk2,
    stats.perk3,
    stats.perk4,
    stats.perk5,
  ];

  return candidates
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map((value) => String(value))
    .filter((value) => value !== "0");
}

function buildObjectives(team: Record<string, unknown>) {
  const keys = [
    "baronKills",
    "dragonKills",
    "firstBaron",
    "firstBlood",
    "firstDargon",
    "firstInhibitor",
    "firstTower",
    "hordeKills",
    "inhibitorKills",
    "riftHeraldKills",
    "towerKills",
    "vilemawKills",
  ];

  return keys.reduce<Record<string, unknown>>((accumulator, key) => {
    if (key in team) {
      accumulator[key] = team[key];
    }
    return accumulator;
  }, {});
}

function getIdentityMap(game: Record<string, unknown>) {
  const identities = Array.isArray(game.participantIdentities) ? game.participantIdentities : [];
  return new Map<number, Record<string, unknown>>(
    identities
      .map((identity) => {
        const entry = identity as Record<string, unknown>;
        const participantId = readNumber(entry.participantId);
        const player = entry.player;
        if (!participantId || !player || typeof player !== "object") {
          return undefined;
        }
        return [participantId, player as Record<string, unknown>] as const;
      })
      .filter((entry): entry is readonly [number, Record<string, unknown>] => Boolean(entry)),
  );
}

function listTables(sourceDb: SqliteDatabase) {
  return new Set(
    (sourceDb.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>)
      .map((row) => row.name),
  );
}

function getLatestLegacyDbFile() {
  if (!fs.existsSync(paths.legacyDbDir)) {
    return undefined;
  }

  const candidates = fs.readdirSync(paths.legacyDbDir)
    .filter((entry) => entry.endsWith(".sqlite"))
    .map((entry) => path.join(paths.legacyDbDir, entry))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);

  return candidates[0];
}

function buildCurrentMatches(sourceDb: SqliteDatabase) {
  const matches = sourceDb.prepare(`
    SELECT *
    FROM matches
    ORDER BY COALESCE(game_creation, retrieved_at) ASC, match_id ASC
  `).all() as CurrentMatchRow[];

  const participantRows = sourceDb.prepare(`
    SELECT *
    FROM match_participants
    ORDER BY match_id ASC, participant_index ASC
  `).all() as CurrentParticipantRow[];

  const teamRows = sourceDb.prepare(`
    SELECT *
    FROM match_teams
    ORDER BY match_id ASC, team_id ASC
  `).all() as CurrentTeamRow[];

  const participantsByMatchId = new Map<string, CurrentParticipantRow[]>();
  for (const participant of participantRows) {
    const current = participantsByMatchId.get(participant.match_id) ?? [];
    current.push(participant);
    participantsByMatchId.set(participant.match_id, current);
  }

  const teamsByMatchId = new Map<string, CurrentTeamRow[]>();
  for (const team of teamRows) {
    const current = teamsByMatchId.get(team.match_id) ?? [];
    current.push(team);
    teamsByMatchId.set(team.match_id, current);
  }

  return matches.map((match) => ({
    matchId: match.match_id,
    queueId: match.queue_id ?? undefined,
    gameMode: match.game_mode ?? undefined,
    gameVersion: match.game_version ?? undefined,
    gameModeMutators: parseJson<string[]>(match.game_mode_mutators_json),
    mapId: match.map_id ?? undefined,
    gameCreation: match.game_creation ?? undefined,
    gameStartTimestamp: match.game_start_timestamp ?? undefined,
    gameEndTimestamp: match.game_end_timestamp ?? undefined,
    gameDuration: match.game_duration ?? undefined,
    retrievedAt: match.retrieved_at,
    summary: match.summary,
    rawPayload: match.raw_payload,
    participants: (participantsByMatchId.get(match.match_id) ?? []).map((participant) => ({
      participantId: participant.participant_id ?? undefined,
      puuid: participant.puuid ?? undefined,
      riotIdGameName: participant.riot_id_game_name ?? undefined,
      riotIdTagline: participant.riot_id_tagline ?? undefined,
      summonerName: participant.summoner_name ?? undefined,
      teamId: participant.team_id ?? undefined,
      championId: participant.champion_id ?? undefined,
      championName: participant.champion_name ?? undefined,
      spell1Id: participant.spell1_id ?? undefined,
      spell2Id: participant.spell2_id ?? undefined,
      kills: participant.kills ?? undefined,
      deaths: participant.deaths ?? undefined,
      assists: participant.assists ?? undefined,
      doubleKills: participant.double_kills ?? undefined,
      tripleKills: participant.triple_kills ?? undefined,
      quadraKills: participant.quadra_kills ?? undefined,
      pentaKills: participant.penta_kills ?? undefined,
      totalDamageDealt: participant.total_damage_dealt ?? undefined,
      totalDamageTaken: participant.total_damage_taken ?? undefined,
      goldEarned: participant.gold_earned ?? undefined,
      totalHeal: participant.total_heal ?? undefined,
      totalCs: participant.total_cs ?? undefined,
      championLevel: participant.champion_level ?? undefined,
      visionScore: participant.vision_score ?? undefined,
      timeCcOthers: participant.time_cc_others ?? undefined,
      largestKillingSpree: participant.largest_killing_spree ?? undefined,
      damageToTurrets: participant.damage_to_turrets ?? undefined,
      win: readBoolean(participant.win),
      placement: participant.placement ?? undefined,
      items: parseJson<string[]>(participant.items_json),
      augments: parseJson<string[]>(participant.augments_json),
      perks: parseJson<string[]>(participant.perks_json),
      stats: parseJson<Record<string, unknown>>(participant.stats_json),
      rawPayload: participant.raw_payload,
    })),
    teams: (teamsByMatchId.get(match.match_id) ?? []).map((team) => ({
      teamId: team.team_id,
      win: readBoolean(team.win),
      objectives: parseJson<Record<string, unknown>>(team.objectives_json),
      rawPayload: team.raw_payload,
    })),
  } satisfies MatchEntity));
}

function buildParticipantsFromLegacyRows(
  rows: LegacyParticipantRow[],
  championNameById: Map<number, string>,
) {
  return rows
    .slice()
    .sort((left, right) => left.participant_index - right.participant_index)
    .map((row) => {
      const rawPayload = {
        participantIndex: row.participant_index,
        puuid: row.puuid,
        summonerName: row.summoner_name,
        riotIdTagline: row.tag_line,
        championId: row.champion_id,
        teamId: row.team_id,
        win: row.win,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        totalDamageDealt: row.total_damage_dealt,
        totalDamageTaken: row.total_damage_taken,
        goldEarned: row.gold_earned,
        totalHeal: row.total_heal,
        totalCs: row.total_cs,
        championLevel: row.champion_level,
        augment1: row.augment1,
        augment2: row.augment2,
        augment3: row.augment3,
        augment4: row.augment4,
        item0: row.item0,
        item1: row.item1,
        item2: row.item2,
        item3: row.item3,
        item4: row.item4,
        item5: row.item5,
      } satisfies Record<string, unknown>;

      return {
        puuid: row.puuid ?? undefined,
        summonerName: row.summoner_name ?? undefined,
        riotIdTagline: row.tag_line ?? undefined,
        teamId: row.team_id ?? undefined,
        championId: row.champion_id ?? undefined,
        championName: row.champion_id ? championNameById.get(row.champion_id) : undefined,
        kills: row.kills ?? undefined,
        deaths: row.deaths ?? undefined,
        assists: row.assists ?? undefined,
        totalDamageDealt: row.total_damage_dealt ?? undefined,
        totalDamageTaken: row.total_damage_taken ?? undefined,
        goldEarned: row.gold_earned ?? undefined,
        totalHeal: row.total_heal ?? undefined,
        totalCs: row.total_cs ?? undefined,
        championLevel: row.champion_level ?? undefined,
        win: readBoolean(row.win),
        items: normalizeItemIds(rawPayload),
        augments: normalizeAugmentIds(rawPayload),
        perks: [],
        stats: rawPayload,
        rawPayload: JSON.stringify(rawPayload),
      };
    });
}

function buildTeamsFromParticipants(participants: MatchEntity["participants"]) {
  const grouped = new Map<number, MatchEntity["participants"]>();

  for (const participant of participants) {
    if (participant.teamId === undefined) {
      continue;
    }
    const current = grouped.get(participant.teamId) ?? [];
    current.push(participant);
    grouped.set(participant.teamId, current);
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([teamId, teamParticipants]) => ({
      teamId,
      win: teamParticipants.some((participant) => participant.win),
      objectives: {},
      rawPayload: JSON.stringify({ teamId, derivedFromParticipants: true }),
    }));
}

function mapLegacyGameToMatch(
  row: LegacyGameRow,
  legacyParticipants: Map<number, LegacyParticipantRow[]>,
  championNameById: Map<number, string>,
  retrievedAt: number,
) {
  const matchId = String(row.game_id);
  const rawPayload = row.raw_json ?? JSON.stringify({ gameId: row.game_id });
  const fallbackParticipants = buildParticipantsFromLegacyRows(legacyParticipants.get(row.game_id) ?? [], championNameById);

  try {
    const game = JSON.parse(rawPayload) as Record<string, unknown>;
    const metadata = (game.gameMetadata ?? {}) as Record<string, unknown>;
    const identityMap = getIdentityMap(game);
    const participants = Array.isArray(game.participants) ? game.participants : [];
    const teams = Array.isArray(game.teams) ? game.teams : [];
    const queueId = readNumber(game.queueId) ?? row.queue_id ?? undefined;
    const gameMode = typeof game.gameMode === "string" ? game.gameMode : row.game_mode ?? undefined;
    const gameModeMutators = Array.isArray(game.gameModeMutators)
      ? game.gameModeMutators.filter((entry): entry is string => typeof entry === "string")
      : [];

    const normalizedParticipants = participants.length
      ? participants.map((participant) => {
          const entry = participant as Record<string, unknown>;
          const stats = (entry.stats ?? {}) as Record<string, unknown>;
          const participantId = readNumber(entry.participantId ?? stats.participantId);
          const identity = participantId ? identityMap.get(participantId) : undefined;
          const championId = readNumber(entry.championId);

          return {
            participantId,
            puuid: identity?.puuid ? String(identity.puuid) : entry.puuid ? String(entry.puuid) : undefined,
            riotIdGameName: identity?.gameName ? String(identity.gameName) : entry.riotIdGameName ? String(entry.riotIdGameName) : undefined,
            riotIdTagline: identity?.tagLine ? String(identity.tagLine) : entry.riotIdTagline ? String(entry.riotIdTagline) : undefined,
            summonerName:
              identity?.summonerName && String(identity.summonerName).trim().length > 0
                ? String(identity.summonerName)
                : identity?.gameName
                  ? String(identity.gameName)
                  : entry.summonerName
                    ? String(entry.summonerName)
                    : undefined,
            teamId: readNumber(entry.teamId),
            championId,
            championName: championId ? championNameById.get(championId) : undefined,
            spell1Id: readNumber(entry.spell1Id ?? stats.spell1Id),
            spell2Id: readNumber(entry.spell2Id ?? stats.spell2Id),
            kills: readNumber(entry.kills ?? stats.kills),
            deaths: readNumber(entry.deaths ?? stats.deaths),
            assists: readNumber(entry.assists ?? stats.assists),
            doubleKills: readNumber(stats.doubleKills),
            tripleKills: readNumber(stats.tripleKills),
            quadraKills: readNumber(stats.quadraKills),
            pentaKills: readNumber(stats.pentaKills),
            totalDamageDealt: readNumber(stats.totalDamageDealtToChampions ?? stats.totalDamageDealt),
            totalDamageTaken: readNumber(stats.totalDamageTaken),
            goldEarned: readNumber(stats.goldEarned),
            totalHeal: readNumber(stats.totalHeal),
            totalCs:
              (readNumber(stats.totalMinionsKilled) ?? 0) +
              (readNumber(stats.neutralMinionsKilled) ?? 0) ||
              readNumber(stats.totalCs),
            championLevel: readNumber(stats.champLevel ?? stats.championLevel),
            visionScore: readNumber(stats.visionScore),
            timeCcOthers: readNumber(stats.timeCCingOthers ?? stats.timeCcOthers),
            largestKillingSpree: readNumber(stats.largestKillingSpree),
            damageToTurrets: readNumber(stats.damageDealtToTurrets ?? stats.damageToTurrets),
            win: readBoolean(entry.win ?? stats.win),
            placement: readNumber(entry.placement ?? stats.subteamPlacement),
            items: normalizeItemIds(stats),
            augments: normalizeAugmentIds(stats),
            perks: normalizePerkIds(entry, stats),
            stats: { ...entry, stats },
            rawPayload: JSON.stringify(entry),
          };
        })
      : fallbackParticipants;

    const normalizedTeams = teams.length
      ? teams.map((team) => {
          const entry = team as Record<string, unknown>;
          return {
            teamId: Number(entry.teamId ?? 0),
            win: readBoolean(entry.win),
            objectives:
              entry.objectives && typeof entry.objectives === "object" && Object.keys(entry.objectives as object).length > 0
                ? (entry.objectives as Record<string, unknown>)
                : buildObjectives(entry),
            rawPayload: JSON.stringify(entry),
          };
        })
      : buildTeamsFromParticipants(normalizedParticipants);

    const summary = `${gameMode ?? "League"} #${matchId} - ${normalizedParticipants.length} participants${gameModeMutators.length ? ` - ${gameModeMutators.join(", ")}` : ""}`;

    return {
      matchId: String(game.gameId ?? metadata.matchId ?? matchId),
      queueId,
      gameMode,
      gameVersion: typeof game.gameVersion === "string" ? game.gameVersion : undefined,
      gameModeMutators,
      mapId: readNumber(game.mapId),
      gameCreation: readNumber(game.gameCreation) ?? row.game_creation ?? undefined,
      gameStartTimestamp: readNumber(game.gameStartTimestamp),
      gameEndTimestamp: readNumber(game.gameEndTimestamp),
      gameDuration: readNumber(game.gameDuration) ?? row.game_duration ?? undefined,
      retrievedAt,
      summary,
      participants: normalizedParticipants,
      teams: normalizedTeams,
      rawPayload,
    } satisfies MatchEntity;
  } catch {
    const summary = `${row.game_mode ?? "League"} #${matchId} - ${fallbackParticipants.length} participants`;
    return {
      matchId,
      queueId: row.queue_id ?? undefined,
      gameMode: row.game_mode ?? undefined,
      gameModeMutators: [],
      gameCreation: row.game_creation ?? undefined,
      gameDuration: row.game_duration ?? undefined,
      retrievedAt,
      summary,
      participants: fallbackParticipants,
      teams: buildTeamsFromParticipants(fallbackParticipants),
      rawPayload,
    } satisfies MatchEntity;
  }
}

function importCurrentSchema(sourceDb: SqliteDatabase, sourceTables: Set<string>) {
  const summary = {
    schema: "current",
    matches: 0,
    champions: 0,
    items: 0,
    augments: 0,
    metadata: 0,
    settings: 0,
    ratings: 0,
    syncRuns: 0,
  };

  if (sourceTables.has("matches") && sourceTables.has("match_participants")) {
    const matches = buildCurrentMatches(sourceDb);
    matchRepository.upsertMatches(matches);
    summary.matches = matches.length;
  }

  if (sourceTables.has("static_champions")) {
    const champions = sourceDb.prepare("SELECT * FROM static_champions ORDER BY name ASC").all() as Array<{
      id: string;
      numeric_id: number;
      key: string;
      name: string;
      title: string | null;
      icon_path: string;
      icon_url: string;
      version: string;
      raw_payload: string;
    }>;
    db.transaction((tx) => {
      for (const champion of champions) {
        tx.insert(staticChampions)
          .values({
            id: champion.id,
            numericId: champion.numeric_id,
            key: champion.key,
            name: champion.name,
            title: champion.title,
            iconPath: champion.icon_path,
            iconUrl: champion.icon_url,
            version: champion.version,
            rawPayload: champion.raw_payload,
          })
          .onConflictDoUpdate({
            target: staticChampions.id,
            set: {
              numericId: champion.numeric_id,
              key: champion.key,
              name: champion.name,
              title: champion.title,
              iconPath: champion.icon_path,
              iconUrl: champion.icon_url,
              version: champion.version,
              rawPayload: champion.raw_payload,
            },
          })
          .run();
      }
    });
    summary.champions = champions.length;
  }

  if (sourceTables.has("static_items")) {
    const items = sourceDb.prepare("SELECT * FROM static_items ORDER BY name ASC").all() as Array<{
      id: string;
      name: string;
      description: string | null;
      icon_path: string;
      icon_url: string;
      version: string;
      raw_payload: string;
    }>;
    db.transaction((tx) => {
      for (const item of items) {
        tx.insert(staticItems)
          .values({
            id: item.id,
            name: item.name,
            description: item.description,
            iconPath: item.icon_path,
            iconUrl: item.icon_url,
            version: item.version,
            rawPayload: item.raw_payload,
          })
          .onConflictDoUpdate({
            target: staticItems.id,
            set: {
              name: item.name,
              description: item.description,
              iconPath: item.icon_path,
              iconUrl: item.icon_url,
              version: item.version,
              rawPayload: item.raw_payload,
            },
          })
          .run();
      }
    });
    summary.items = items.length;
  }

  if (sourceTables.has("static_augments")) {
    const augments = sourceDb.prepare("SELECT * FROM static_augments ORDER BY name ASC").all() as Array<{
      id: string;
      name: string;
      description: string | null;
      rarity: string | null;
      icon_path: string;
      icon_url: string | null;
      version: string;
      raw_payload: string;
    }>;
    db.transaction((tx) => {
      for (const augment of augments) {
        tx.insert(staticAugments)
          .values({
            id: augment.id,
            name: augment.name,
            description: augment.description,
            rarity: augment.rarity,
            iconPath: augment.icon_path,
            iconUrl: augment.icon_url,
            version: augment.version,
            rawPayload: augment.raw_payload,
          })
          .onConflictDoUpdate({
            target: staticAugments.id,
            set: {
              name: augment.name,
              description: augment.description,
              rarity: augment.rarity,
              iconPath: augment.icon_path,
              iconUrl: augment.icon_url,
              version: augment.version,
              rawPayload: augment.raw_payload,
            },
          })
          .run();
      }
    });
    summary.augments = augments.length;
  }

  if (sourceTables.has("app_metadata")) {
    const metadata = sourceDb.prepare("SELECT key, value, updated_at FROM app_metadata ORDER BY key ASC").all() as SourceMetadataRow[];
    db.transaction((tx) => {
      for (const row of metadata) {
        tx.insert(appMetadata)
          .values({ key: row.key, value: row.value, updatedAt: row.updated_at })
          .onConflictDoUpdate({
            target: appMetadata.key,
            set: { value: row.value, updatedAt: row.updated_at },
          })
          .run();
      }
    });
    summary.metadata = metadata.length;
  }

  if (sourceTables.has("app_settings")) {
    const settings = sourceDb.prepare("SELECT key, value, updated_at FROM app_settings ORDER BY key ASC").all() as SourceSettingRow[];
    db.transaction((tx) => {
      for (const row of settings) {
        tx.insert(appSettings)
          .values({ key: row.key, value: row.value, updatedAt: row.updated_at })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: { value: row.value, updatedAt: row.updated_at },
          })
          .run();
      }
    });
    summary.settings = settings.length;
  }

  if (sourceTables.has("player_ratings")) {
    const ratings = sourceDb.prepare("SELECT * FROM player_ratings").all() as SourceRatingRow[];
    db.transaction((tx) => {
      for (const row of ratings) {
        const targetPuuid = row.target_puuid ?? row.puuid;
        if (!targetPuuid) {
          continue;
        }
        tx.insert(playerRatings)
          .values({
            targetPuuid,
            summonerName: row.summoner_name ?? null,
            rating: row.rating ?? null,
            note: row.note ?? null,
            updatedAt: row.updated_at ?? Date.now(),
          })
          .onConflictDoUpdate({
            target: playerRatings.targetPuuid,
            set: {
              summonerName: row.summoner_name ?? null,
              rating: row.rating ?? null,
              note: row.note ?? null,
              updatedAt: row.updated_at ?? Date.now(),
            },
          })
          .run();
      }
    });
    summary.ratings = ratings.filter((row) => row.target_puuid ?? row.puuid).length;
  }

  if (sourceTables.has("sync_runs")) {
    const runs = sourceDb.prepare("SELECT * FROM sync_runs ORDER BY started_at ASC").all() as SourceSyncRunRow[];
    db.transaction((tx) => {
      for (const row of runs) {
        tx.insert(syncRuns)
          .values({
            id: row.id,
            status: row.status,
            startedAt: row.started_at,
            finishedAt: row.finished_at,
            stored: row.stored ?? 0,
            updated: row.updated ?? 0,
            skipped: row.skipped ?? 0,
            errorCode: row.error_code,
            errorMessage: row.error_message,
          })
          .onConflictDoUpdate({
            target: syncRuns.id,
            set: {
              status: row.status,
              startedAt: row.started_at,
              finishedAt: row.finished_at,
              stored: row.stored ?? 0,
              updated: row.updated ?? 0,
              skipped: row.skipped ?? 0,
              errorCode: row.error_code,
              errorMessage: row.error_message,
            },
          })
          .run();
      }
    });
    summary.syncRuns = runs.length;
  }

  return summary;
}

function importLegacySchema(sourceDb: SqliteDatabase) {
  const importedAt = Date.now();
  const championNameById = new Map<number, string>(
    db.select({ numericId: staticChampions.numericId, name: staticChampions.name })
      .from(staticChampions)
      .all()
      .map((row) => [row.numericId, row.name]),
  );

  const legacyParticipants = new Map<number, LegacyParticipantRow[]>();
  for (const row of sourceDb.prepare("SELECT * FROM game_participants ORDER BY game_id ASC, participant_index ASC").all() as LegacyParticipantRow[]) {
    const current = legacyParticipants.get(row.game_id) ?? [];
    current.push(row);
    legacyParticipants.set(row.game_id, current);
  }

  const legacyGames = sourceDb.prepare("SELECT * FROM games ORDER BY game_creation ASC, game_id ASC").all() as LegacyGameRow[];
  const matches = legacyGames.map((row) => mapLegacyGameToMatch(row, legacyParticipants, championNameById, importedAt));
  matchRepository.upsertMatches(matches);

  let ratings = 0;
  const sourceTables = listTables(sourceDb);
  if (sourceTables.has("player_ratings")) {
    const sourceRatings = sourceDb.prepare(
      "SELECT puuid, summoner_name, rating, note, updated_at FROM player_ratings WHERE puuid IS NOT NULL AND TRIM(puuid) <> ''",
    ).all() as SourceRatingRow[];

    db.transaction((tx) => {
      for (const rating of sourceRatings) {
        if (!rating.puuid) {
          continue;
        }
        tx.insert(playerRatings)
          .values({
            targetPuuid: rating.puuid,
            summonerName: rating.summoner_name ?? null,
            rating: rating.rating ?? null,
            note: rating.note ?? null,
            updatedAt: rating.updated_at ?? importedAt,
          })
          .onConflictDoUpdate({
            target: playerRatings.targetPuuid,
            set: {
              summonerName: rating.summoner_name ?? null,
              rating: rating.rating ?? null,
              note: rating.note ?? null,
              updatedAt: rating.updated_at ?? importedAt,
            },
          })
          .run();
        ratings += 1;
      }
    });
  }

  return {
    schema: "legacy",
    matches: matches.length,
    ratings,
  };
}

function main() {
  ensureRuntimeDirectories();
  runMigrations();

  const sourceArg = process.argv[2];
  const sourceFile = sourceArg
    ? path.resolve(process.cwd(), sourceArg)
    : getLatestLegacyDbFile();

  if (!sourceFile || !fs.existsSync(sourceFile)) {
    console.log(JSON.stringify({ imported: false, sourceFile: sourceFile ?? null, reason: "no_legacy_db_found" }, null, 2));
    return;
  }

  const sourceDb = new Database(sourceFile, { readonly: true });
  try {
    sourceDb.pragma("foreign_keys = ON");
    const sourceTables = listTables(sourceDb);

    const summary = sourceTables.has("matches") && sourceTables.has("match_participants")
      ? importCurrentSchema(sourceDb, sourceTables)
      : sourceTables.has("games") && sourceTables.has("game_participants")
        ? importLegacySchema(sourceDb)
        : { schema: "unknown", matches: 0 };

    if (summary.schema === "unknown") {
      throw new Error(`Unsupported legacy database schema: ${sourceFile}`);
    }

    console.log(JSON.stringify({ imported: true, sourceFile, targetFile: paths.dbFile, summary }, null, 2));
  } finally {
    sourceDb.close();
  }
}

main();
