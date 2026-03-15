import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { ensureRuntimeDirectories, paths } from "../config/paths.js";
import { schemaStatements } from "../db/schema.js";

type SqliteDatabase = InstanceType<typeof Database>;

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

type LegacyRatingRow = {
  puuid: string | null;
  summoner_name: string | null;
  rating: number | null;
  note: string | null;
  updated_at: number | null;
};

type MatchParticipantRecord = {
  participantId?: number;
  puuid?: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  summonerName?: string;
  teamId?: number;
  championId?: number;
  championName?: string;
  spell1Id?: number;
  spell2Id?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  doubleKills?: number;
  tripleKills?: number;
  quadraKills?: number;
  pentaKills?: number;
  totalDamageDealt?: number;
  totalDamageTaken?: number;
  goldEarned?: number;
  totalHeal?: number;
  totalCs?: number;
  championLevel?: number;
  visionScore?: number;
  timeCcOthers?: number;
  largestKillingSpree?: number;
  damageToTurrets?: number;
  win?: boolean;
  placement?: number;
  items: string[];
  augments: string[];
  perks: string[];
  stats: Record<string, unknown>;
  rawPayload: string;
};

type MatchTeamRecord = {
  teamId: number;
  win?: boolean;
  objectives: Record<string, unknown>;
  rawPayload: string;
};

type MatchRecord = {
  matchId: string;
  queueId?: number;
  gameMode?: string;
  gameVersion?: string;
  gameModeMutators: string[];
  mapId?: number;
  gameCreation?: number;
  gameStartTimestamp?: number;
  gameEndTimestamp?: number;
  gameDuration?: number;
  retrievedAt: number;
  summary: string;
  participants: MatchParticipantRecord[];
  teams: MatchTeamRecord[];
  rawPayload: string;
};

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

function addColumnIfMissing(db: SqliteDatabase, tableName: string, columnName: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function runMigrations(db: SqliteDatabase) {
  const transaction = db.transaction(() => {
    for (const statement of schemaStatements) {
      db.exec(statement);
    }

    addColumnIfMissing(db, "matches", "game_version", "TEXT");
    addColumnIfMissing(db, "matches", "game_mode_mutators_json", "TEXT NOT NULL DEFAULT '[]'");

    addColumnIfMissing(db, "match_participants", "participant_id", "INTEGER");
    addColumnIfMissing(db, "match_participants", "spell1_id", "INTEGER");
    addColumnIfMissing(db, "match_participants", "spell2_id", "INTEGER");
    addColumnIfMissing(db, "match_participants", "double_kills", "INTEGER");
    addColumnIfMissing(db, "match_participants", "triple_kills", "INTEGER");
    addColumnIfMissing(db, "match_participants", "quadra_kills", "INTEGER");
    addColumnIfMissing(db, "match_participants", "penta_kills", "INTEGER");
    addColumnIfMissing(db, "match_participants", "total_damage_dealt", "INTEGER");
    addColumnIfMissing(db, "match_participants", "total_damage_taken", "INTEGER");
    addColumnIfMissing(db, "match_participants", "gold_earned", "INTEGER");
    addColumnIfMissing(db, "match_participants", "total_heal", "INTEGER");
    addColumnIfMissing(db, "match_participants", "total_cs", "INTEGER");
    addColumnIfMissing(db, "match_participants", "champion_level", "INTEGER");
    addColumnIfMissing(db, "match_participants", "vision_score", "INTEGER");
    addColumnIfMissing(db, "match_participants", "time_cc_others", "INTEGER");
    addColumnIfMissing(db, "match_participants", "largest_killing_spree", "INTEGER");
    addColumnIfMissing(db, "match_participants", "damage_to_turrets", "INTEGER");

    addColumnIfMissing(db, "match_teams", "bans_json", "TEXT NOT NULL DEFAULT '[]'");

    db.prepare(
      `
        INSERT INTO app_metadata (key, value, updated_at)
        VALUES (@key, @value, @updated_at)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `,
    ).run({
      key: "schema_version",
      value: "3",
      updated_at: Date.now(),
    });
  });

  transaction();
}

function createBackup(dbFile: string) {
  if (!fs.existsSync(dbFile)) {
    return undefined;
  }

  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const backupBase = path.join(paths.dbDir, `mayhemtracker-pre-legacy-merge-${timestamp}.sqlite`);

  fs.copyFileSync(dbFile, backupBase);
  for (const suffix of ["-shm", "-wal"]) {
    const source = `${dbFile}${suffix}`;
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, `${backupBase}${suffix}`);
    }
  }

  return backupBase;
}

function buildParticipantsFromLegacyRows(
  rows: LegacyParticipantRow[],
  championNameById: Map<number, string>,
): MatchParticipantRecord[] {
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

function buildTeamsFromParticipants(participants: MatchParticipantRecord[]): MatchTeamRecord[] {
  const grouped = new Map<number, MatchParticipantRecord[]>();

  for (const participant of participants) {
    if (participant.teamId === undefined) {
      continue;
    }
    const teamParticipants = grouped.get(participant.teamId) ?? [];
    teamParticipants.push(participant);
    grouped.set(participant.teamId, teamParticipants);
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
          } satisfies MatchParticipantRecord;
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
          } satisfies MatchTeamRecord;
        })
      : buildTeamsFromParticipants(normalizedParticipants);

    const summary = `${gameMode ?? "League"} #${matchId} · ${normalizedParticipants.length} participants${gameModeMutators.length ? ` · ${gameModeMutators.join(", ")}` : ""}`;

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
    } satisfies MatchRecord;
  } catch {
    const summary = `${row.game_mode ?? "League"} #${matchId} · ${fallbackParticipants.length} participants`;
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
    } satisfies MatchRecord;
  }
}

function main() {
  ensureRuntimeDirectories();

  const sourceArg = process.argv[2];
  const sourceFile = path.resolve(process.cwd(), sourceArg ?? "../matches.db");

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Legacy database not found: ${sourceFile}`);
  }

  const backupPath = createBackup(paths.dbFile);
  const sourceDb = new Database(sourceFile, { readonly: true });
  const targetDb = new Database(paths.dbFile);

  try {
    sourceDb.pragma("foreign_keys = ON");
    targetDb.pragma("journal_mode = WAL");
    targetDb.pragma("foreign_keys = ON");
    runMigrations(targetDb);

    const existingMatchIds = new Set(
      (targetDb.prepare("SELECT match_id FROM matches").all() as Array<{ match_id: string }>).map((row) => row.match_id),
    );

    const championNameById = new Map<number, string>(
      (targetDb.prepare("SELECT numeric_id, name FROM static_champions").all() as Array<{ numeric_id: number; name: string }>).map(
        (row) => [row.numeric_id, row.name],
      ),
    );

    const legacyParticipants = new Map<number, LegacyParticipantRow[]>();
    for (const row of sourceDb.prepare("SELECT * FROM game_participants ORDER BY game_id ASC, participant_index ASC").all() as LegacyParticipantRow[]) {
      const gameRows = legacyParticipants.get(row.game_id) ?? [];
      gameRows.push(row);
      legacyParticipants.set(row.game_id, gameRows);
    }

    const importedAt = Date.now();
    const legacyGames = sourceDb.prepare("SELECT * FROM games ORDER BY game_creation ASC, game_id ASC").all() as LegacyGameRow[];
    const matchesToInsert = legacyGames
      .filter((row) => !existingMatchIds.has(String(row.game_id)))
      .map((row) => mapLegacyGameToMatch(row, legacyParticipants, championNameById, importedAt));

    const insertMatch = targetDb.prepare(`
      INSERT INTO matches (
        match_id,
        queue_id,
        game_mode,
        game_version,
        game_mode_mutators_json,
        map_id,
        game_creation,
        game_start_timestamp,
        game_end_timestamp,
        game_duration,
        retrieved_at,
        summary,
        raw_payload
      )
      VALUES (
        @matchId,
        @queueId,
        @gameMode,
        @gameVersion,
        @gameModeMutatorsJson,
        @mapId,
        @gameCreation,
        @gameStartTimestamp,
        @gameEndTimestamp,
        @gameDuration,
        @retrievedAt,
        @summary,
        @rawPayload
      )
    `);

    const insertParticipant = targetDb.prepare(`
      INSERT INTO match_participants (
        match_id,
        participant_index,
        participant_id,
        puuid,
        riot_id_game_name,
        riot_id_tagline,
        summoner_name,
        team_id,
        champion_id,
        champion_name,
        spell1_id,
        spell2_id,
        kills,
        deaths,
        assists,
        double_kills,
        triple_kills,
        quadra_kills,
        penta_kills,
        total_damage_dealt,
        total_damage_taken,
        gold_earned,
        total_heal,
        total_cs,
        champion_level,
        vision_score,
        time_cc_others,
        largest_killing_spree,
        damage_to_turrets,
        win,
        placement,
        items_json,
        augments_json,
        perks_json,
        stats_json,
        raw_payload
      )
      VALUES (
        @matchId,
        @participantIndex,
        @participantId,
        @puuid,
        @riotIdGameName,
        @riotIdTagline,
        @summonerName,
        @teamId,
        @championId,
        @championName,
        @spell1Id,
        @spell2Id,
        @kills,
        @deaths,
        @assists,
        @doubleKills,
        @tripleKills,
        @quadraKills,
        @pentaKills,
        @totalDamageDealt,
        @totalDamageTaken,
        @goldEarned,
        @totalHeal,
        @totalCs,
        @championLevel,
        @visionScore,
        @timeCcOthers,
        @largestKillingSpree,
        @damageToTurrets,
        @win,
        @placement,
        @itemsJson,
        @augmentsJson,
        @perksJson,
        @statsJson,
        @rawPayload
      )
    `);

    const insertTeam = targetDb.prepare(`
      INSERT INTO match_teams (
        match_id,
        team_id,
        win,
        bans_json,
        objectives_json,
        raw_payload
      )
      VALUES (
        @matchId,
        @teamId,
        @win,
        @bansJson,
        @objectivesJson,
        @rawPayload
      )
    `);

    const mergeMatches = targetDb.transaction((matches: MatchRecord[]) => {
      for (const match of matches) {
        insertMatch.run({
          ...match,
          gameModeMutatorsJson: JSON.stringify(match.gameModeMutators),
        });

        match.participants.forEach((participant, participantIndex) => {
          insertParticipant.run({
            matchId: match.matchId,
            participantIndex,
            participantId: participant.participantId,
            puuid: participant.puuid,
            riotIdGameName: participant.riotIdGameName,
            riotIdTagline: participant.riotIdTagline,
            summonerName: participant.summonerName,
            teamId: participant.teamId,
            championId: participant.championId,
            championName: participant.championName,
            spell1Id: participant.spell1Id,
            spell2Id: participant.spell2Id,
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            doubleKills: participant.doubleKills,
            tripleKills: participant.tripleKills,
            quadraKills: participant.quadraKills,
            pentaKills: participant.pentaKills,
            totalDamageDealt: participant.totalDamageDealt,
            totalDamageTaken: participant.totalDamageTaken,
            goldEarned: participant.goldEarned,
            totalHeal: participant.totalHeal,
            totalCs: participant.totalCs,
            championLevel: participant.championLevel,
            visionScore: participant.visionScore,
            timeCcOthers: participant.timeCcOthers,
            largestKillingSpree: participant.largestKillingSpree,
            damageToTurrets: participant.damageToTurrets,
            win: participant.win === undefined ? null : participant.win ? 1 : 0,
            placement: participant.placement,
            itemsJson: JSON.stringify(participant.items),
            augmentsJson: JSON.stringify(participant.augments),
            perksJson: JSON.stringify(participant.perks),
            statsJson: JSON.stringify(participant.stats),
            rawPayload: participant.rawPayload,
          });
        });

        match.teams.forEach((team) => {
          insertTeam.run({
            matchId: match.matchId,
            teamId: team.teamId,
            win: team.win === undefined ? null : team.win ? 1 : 0,
            bansJson: JSON.stringify([]),
            objectivesJson: JSON.stringify(team.objectives),
            rawPayload: team.rawPayload,
          });
        });
      }
    });

    mergeMatches(matchesToInsert);

    const existingRatings = new Map(
      (
        targetDb.prepare("SELECT target_puuid, updated_at FROM player_ratings").all() as Array<{
          target_puuid: string;
          updated_at: number;
        }>
      ).map((row) => [row.target_puuid, row.updated_at]),
    );

    const sourceRatings = sourceDb.prepare(
      "SELECT puuid, summoner_name, rating, note, updated_at FROM player_ratings WHERE puuid IS NOT NULL AND TRIM(puuid) <> ''",
    ).all() as LegacyRatingRow[];

    const upsertRating = targetDb.prepare(`
      INSERT INTO player_ratings (target_puuid, summoner_name, rating, note, updated_at)
      VALUES (@targetPuuid, @summonerName, @rating, @note, @updatedAt)
      ON CONFLICT(target_puuid) DO UPDATE SET
        summoner_name = excluded.summoner_name,
        rating = excluded.rating,
        note = excluded.note,
        updated_at = excluded.updated_at
    `);

    let ratingsMerged = 0;
    for (const rating of sourceRatings) {
      if (!rating.puuid) {
        continue;
      }
      const existingUpdatedAt = existingRatings.get(rating.puuid) ?? -1;
      const sourceUpdatedAt = rating.updated_at ?? importedAt;
      if (existingUpdatedAt >= sourceUpdatedAt) {
        continue;
      }

      upsertRating.run({
        targetPuuid: rating.puuid,
        summonerName: rating.summoner_name,
        rating: rating.rating,
        note: rating.note,
        updatedAt: sourceUpdatedAt,
      });
      ratingsMerged += 1;
    }

    const skippedLegacySettings = (sourceDb.prepare("SELECT key FROM settings ORDER BY key ASC").all() as Array<{ key: string }>).map(
      (row) => row.key,
    );

    console.log(
      JSON.stringify(
        {
          sourceFile,
          targetFile: paths.dbFile,
          backupPath,
          matchesInserted: matchesToInsert.length,
          matchesSkippedExisting: legacyGames.length - matchesToInsert.length,
          ratingsMerged,
          skippedLegacySettings,
        },
        null,
        2,
      ),
    );
  } finally {
    sourceDb.close();
    targetDb.close();
  }
}

main();