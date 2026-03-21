import { getDb } from "../db/index.js";
import type { MatchDetailDto, MatchEntity, MatchListItemDto } from "../types/match.js";

const db = getDb();
const SQLITE_PARAM_LIMIT = 900;

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function chunkValues<T>(items: T[], size: number) {
  const output = [] as T[][];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

export class MatchRepository {
  upsertMatches(matches: MatchEntity[]) {
    const upsertMatch = db.prepare(`
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
      ON CONFLICT(match_id) DO UPDATE SET
        queue_id = excluded.queue_id,
        game_mode = excluded.game_mode,
        game_version = excluded.game_version,
        game_mode_mutators_json = excluded.game_mode_mutators_json,
        map_id = excluded.map_id,
        game_creation = excluded.game_creation,
        game_start_timestamp = excluded.game_start_timestamp,
        game_end_timestamp = excluded.game_end_timestamp,
        game_duration = excluded.game_duration,
        retrieved_at = excluded.retrieved_at,
        summary = excluded.summary,
        raw_payload = excluded.raw_payload
    `);

    const deleteParticipants = db.prepare(`DELETE FROM match_participants WHERE match_id = ?`);
    const deleteTeams = db.prepare(`DELETE FROM match_teams WHERE match_id = ?`);
    const insertParticipant = db.prepare(`
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
    const insertTeam = db.prepare(`
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

    const transaction = db.transaction((rows: MatchEntity[]) => {
      for (const match of rows) {
        upsertMatch.run({
          ...match,
          gameModeMutatorsJson: JSON.stringify(match.gameModeMutators),
        });
        deleteParticipants.run(match.matchId);
        deleteTeams.run(match.matchId);

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
            win: participant.win ? 1 : 0,
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
            win: team.win ? 1 : 0,
            bansJson: JSON.stringify([]),
            objectivesJson: JSON.stringify(team.objectives),
            rawPayload: team.rawPayload,
          });
        });
      }
    });

    transaction(matches);
  }

  existingMatchIds(matchIds: string[]) {
    if (!matchIds.length) {
      return new Set<string>();
    }

    const output = new Set<string>();
    for (const chunk of chunkValues(matchIds, SQLITE_PARAM_LIMIT)) {
      const placeholders = chunk.map(() => "?").join(", ");
      const rows = db.prepare(`SELECT match_id FROM matches WHERE match_id IN (${placeholders})`).all(...chunk) as Array<{ match_id: string }>;
      for (const row of rows) {
        output.add(row.match_id);
      }
    }

    return output;
  }

  listMatches(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const rows = db.prepare(`
      SELECT *
      FROM matches
      ORDER BY COALESCE(game_creation, retrieved_at) DESC
      LIMIT ? OFFSET ?
    `).all(pageSize, offset) as Array<Record<string, unknown>>;

    return this.hydrateListItems(rows);
  }

  listAllMatches() {
    const rows = db.prepare(`
      SELECT *
      FROM matches
      ORDER BY COALESCE(game_creation, retrieved_at) DESC
    `).all() as Array<Record<string, unknown>>;

    return this.hydrateListItems(rows);
  }

  listMatchesByIds(matchIds: string[]) {
    if (!matchIds.length) {
      return [] as MatchListItemDto[];
    }

    const rows = [] as Array<Record<string, unknown>>;
    for (const chunk of chunkValues(matchIds, SQLITE_PARAM_LIMIT)) {
      const placeholders = chunk.map(() => "?").join(", ");
      rows.push(
        ...(db.prepare(`SELECT * FROM matches WHERE match_id IN (${placeholders})`).all(...chunk) as Array<Record<string, unknown>>),
      );
    }

    const byId = new Map(this.hydrateListItems(rows).map((match) => [match.matchId, match]));
    return matchIds.map((matchId) => byId.get(matchId)).filter((match): match is MatchListItemDto => Boolean(match));
  }

  listRecentTrackedMatches(trackedPuuid: string, limit: number) {
    const rows = db.prepare(`
      SELECT DISTINCT m.*
      FROM matches m
      JOIN match_participants mp ON mp.match_id = m.match_id
      WHERE mp.puuid = ?
      ORDER BY COALESCE(m.game_creation, m.retrieved_at) DESC
      LIMIT ?
    `).all(trackedPuuid, limit) as Array<Record<string, unknown>>;

    return this.hydrateListItems(rows);
  }

  getTrackedPlayer() {
    const row = db.prepare(`
      SELECT
        puuid,
        COALESCE(MAX(NULLIF(summoner_name, '')), MAX(NULLIF(riot_id_game_name, '')), 'Unknown summoner') AS summoner_name,
        COUNT(*) AS matches
      FROM match_participants
      WHERE puuid IS NOT NULL
      GROUP BY puuid
      ORDER BY matches DESC
      LIMIT 1
    `).get() as { puuid?: string; summoner_name?: string; matches?: number } | undefined;

    if (!row?.puuid) {
      return undefined;
    }

    return {
      puuid: row.puuid,
      summonerName: row.summoner_name ?? "Unknown summoner",
      matches: row.matches ?? 0,
    };
  }

  countMatches() {
    const result = db.prepare(`SELECT COUNT(*) as total FROM matches`).get() as { total: number };
    return result.total;
  }

  getMatchById(matchId: string): MatchDetailDto | undefined {
    const match = db.prepare(`SELECT * FROM matches WHERE match_id = ?`).get(matchId) as
      | Record<string, unknown>
      | undefined;

    if (!match) {
      return undefined;
    }

    const base = this.hydrateListItems([match])[0];
    const teams = db.prepare(`SELECT * FROM match_teams WHERE match_id = ? ORDER BY team_id ASC`).all(matchId) as Array<Record<string, unknown>>;

    return {
      ...base,
      gameStartTimestamp: (match.game_start_timestamp as number | null) ?? undefined,
      gameEndTimestamp: (match.game_end_timestamp as number | null) ?? undefined,
      mapId: (match.map_id as number | null) ?? undefined,
      teams: teams.map((team) => ({
        teamId: team.team_id as number,
        win: Boolean(team.win),
        objectives: parseJson<Record<string, unknown>>(team.objectives_json as string),
        rawPayload: team.raw_payload as string,
      })),
      rawPayload: parseJson<unknown>(match.raw_payload as string),
    };
  }

  clearMatches() {
    const transaction = db.transaction(() => {
      db.prepare(`DELETE FROM match_participants`).run();
      db.prepare(`DELETE FROM match_teams`).run();
      db.prepare(`DELETE FROM matches`).run();
      db.prepare(`DELETE FROM sync_runs`).run();
    });

    transaction();
  }

  private hydrateListItems(matchRows: Array<Record<string, unknown>>) {
    if (!matchRows.length) {
      return [] as MatchListItemDto[];
    }

    const matchIds = matchRows.map((match) => String(match.match_id));
    const participantsByMatchId = this.getParticipantsByMatchIds(matchIds);

    return matchRows.map((match) => ({
      matchId: match.match_id as string,
      queueId: (match.queue_id as number | null) ?? undefined,
      gameMode: (match.game_mode as string | null) ?? undefined,
      gameVersion: (match.game_version as string | null) ?? undefined,
      gameModeMutators: parseJson<string[]>(match.game_mode_mutators_json as string),
      gameCreation: (match.game_creation as number | null) ?? undefined,
      gameDuration: (match.game_duration as number | null) ?? undefined,
      retrievedAt: match.retrieved_at as number,
      summary: match.summary as string,
      participants: participantsByMatchId.get(String(match.match_id)) ?? [],
    }));
  }

  private getParticipantsByMatchIds(matchIds: string[]) {
    const map = new Map<string, MatchListItemDto["participants"]>();

    for (const chunk of chunkValues(matchIds, SQLITE_PARAM_LIMIT)) {
      const placeholders = chunk.map(() => "?").join(", ");
      const rows = db.prepare(`
        SELECT *
        FROM match_participants
        WHERE match_id IN (${placeholders})
        ORDER BY match_id ASC, participant_index ASC
      `).all(...chunk) as Array<Record<string, unknown>>;

      for (const participant of rows) {
        const matchId = String(participant.match_id);
        const current = map.get(matchId) ?? [];
        current.push({
          participantId: (participant.participant_id as number | null) ?? undefined,
          puuid: (participant.puuid as string | null) ?? undefined,
          summonerName: (participant.summoner_name as string | null) ?? undefined,
          riotIdGameName: (participant.riot_id_game_name as string | null) ?? undefined,
          riotIdTagline: (participant.riot_id_tagline as string | null) ?? undefined,
          teamId: (participant.team_id as number | null) ?? undefined,
          championId: (participant.champion_id as number | null) ?? undefined,
          championName: (participant.champion_name as string | null) ?? undefined,
          spell1Id: (participant.spell1_id as number | null) ?? undefined,
          spell2Id: (participant.spell2_id as number | null) ?? undefined,
          kills: (participant.kills as number | null) ?? undefined,
          deaths: (participant.deaths as number | null) ?? undefined,
          assists: (participant.assists as number | null) ?? undefined,
          pentaKills: (participant.penta_kills as number | null) ?? undefined,
          totalDamageDealt: (participant.total_damage_dealt as number | null) ?? undefined,
          totalDamageTaken: (participant.total_damage_taken as number | null) ?? undefined,
          goldEarned: (participant.gold_earned as number | null) ?? undefined,
          totalHeal: (participant.total_heal as number | null) ?? undefined,
          totalCs: (participant.total_cs as number | null) ?? undefined,
          championLevel: (participant.champion_level as number | null) ?? undefined,
          win: Boolean(participant.win),
          items: parseJson<string[]>(participant.items_json as string),
          augments: parseJson<string[]>(participant.augments_json as string),
        });
        map.set(matchId, current);
      }
    }

    return map;
  }
}

export const matchRepository = new MatchRepository();
