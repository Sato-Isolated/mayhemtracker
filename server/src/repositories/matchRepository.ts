import { asc, count, desc, eq, inArray, isNotNull, max } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  matchParticipants as matchParticipantsTable,
  matches as matchesTable,
  matchTeams as matchTeamsTable,
  syncRuns as syncRunsTable,
  type MatchParticipantRow,
  type MatchRow,
  type MatchTeamRow,
} from "../db/schema.js";
import type { MatchDetailDto, MatchEntity, MatchListItemDto } from "../types/match.js";

const SQLITE_PARAM_LIMIT = 900;

const matchSelection = {
  matchId: matchesTable.matchId,
  queueId: matchesTable.queueId,
  gameMode: matchesTable.gameMode,
  gameVersion: matchesTable.gameVersion,
  gameModeMutatorsJson: matchesTable.gameModeMutatorsJson,
  mapId: matchesTable.mapId,
  gameCreation: matchesTable.gameCreation,
  gameStartTimestamp: matchesTable.gameStartTimestamp,
  gameEndTimestamp: matchesTable.gameEndTimestamp,
  gameDuration: matchesTable.gameDuration,
  retrievedAt: matchesTable.retrievedAt,
  summary: matchesTable.summary,
  rawPayload: matchesTable.rawPayload,
};

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

function mapMatchRow(match: MatchRow): MatchListItemDto {
  return {
    matchId: match.matchId,
    queueId: match.queueId ?? undefined,
    gameMode: match.gameMode ?? undefined,
    gameVersion: match.gameVersion ?? undefined,
    gameModeMutators: parseJson<string[]>(match.gameModeMutatorsJson),
    gameCreation: match.gameCreation ?? undefined,
    gameDuration: match.gameDuration ?? undefined,
    retrievedAt: match.retrievedAt,
    summary: match.summary,
    participants: [],
  };
}

function getProfileIconMap(rawPayload: string) {
  const match = parseJson<Record<string, unknown>>(rawPayload);
  const identities = Array.isArray(match.participantIdentities) ? match.participantIdentities : [];
  const icons = new Map<number, number>();

  for (const identity of identities) {
    const entry = identity as Record<string, unknown>;
    const participantId = typeof entry.participantId === "number" ? entry.participantId : undefined;
    const player = entry.player;
    if (!participantId || !player || typeof player !== "object") {
      continue;
    }

    const profileIcon = (player as Record<string, unknown>).profileIcon;
    if (typeof profileIcon === "number") {
      icons.set(participantId, profileIcon);
    }
  }

  return icons;
}

function mapParticipantRow(participant: MatchParticipantRow, profileIconId?: number): MatchListItemDto["participants"][number] {
  return {
    participantId: participant.participantId ?? undefined,
    puuid: participant.puuid ?? undefined,
    summonerName: participant.summonerName ?? undefined,
    riotIdGameName: participant.riotIdGameName ?? undefined,
    riotIdTagline: participant.riotIdTagline ?? undefined,
    profileIconId,
    teamId: participant.teamId ?? undefined,
    championId: participant.championId ?? undefined,
    championName: participant.championName ?? undefined,
    spell1Id: participant.spell1Id ?? undefined,
    spell2Id: participant.spell2Id ?? undefined,
    kills: participant.kills ?? undefined,
    deaths: participant.deaths ?? undefined,
    assists: participant.assists ?? undefined,
    pentaKills: participant.pentaKills ?? undefined,
    totalDamageDealt: participant.totalDamageDealt ?? undefined,
    totalDamageTaken: participant.totalDamageTaken ?? undefined,
    goldEarned: participant.goldEarned ?? undefined,
    totalHeal: participant.totalHeal ?? undefined,
    totalCs: participant.totalCs ?? undefined,
    championLevel: participant.championLevel ?? undefined,
    win: participant.win ?? undefined,
    items: parseJson<string[]>(participant.itemsJson),
    augments: parseJson<string[]>(participant.augmentsJson),
  };
}

function mapTeamRow(team: MatchTeamRow) {
  return {
    teamId: team.teamId,
    win: team.win ?? undefined,
    objectives: parseJson<Record<string, unknown>>(team.objectivesJson),
    rawPayload: team.rawPayload,
  };
}

export class MatchRepository {
  upsertMatches(matches: MatchEntity[]) {
    db.transaction((tx) => {
      for (const match of matches) {
        tx.insert(matchesTable)
          .values({
            matchId: match.matchId,
            queueId: match.queueId ?? null,
            gameMode: match.gameMode ?? null,
            gameVersion: match.gameVersion ?? null,
            gameModeMutatorsJson: JSON.stringify(match.gameModeMutators),
            mapId: match.mapId ?? null,
            gameCreation: match.gameCreation ?? null,
            gameStartTimestamp: match.gameStartTimestamp ?? null,
            gameEndTimestamp: match.gameEndTimestamp ?? null,
            gameDuration: match.gameDuration ?? null,
            retrievedAt: match.retrievedAt,
            summary: match.summary,
            rawPayload: match.rawPayload,
          })
          .onConflictDoUpdate({
            target: matchesTable.matchId,
            set: {
              queueId: match.queueId ?? null,
              gameMode: match.gameMode ?? null,
              gameVersion: match.gameVersion ?? null,
              gameModeMutatorsJson: JSON.stringify(match.gameModeMutators),
              mapId: match.mapId ?? null,
              gameCreation: match.gameCreation ?? null,
              gameStartTimestamp: match.gameStartTimestamp ?? null,
              gameEndTimestamp: match.gameEndTimestamp ?? null,
              gameDuration: match.gameDuration ?? null,
              retrievedAt: match.retrievedAt,
              summary: match.summary,
              rawPayload: match.rawPayload,
            },
          })
          .run();

        tx.delete(matchParticipantsTable)
          .where(eq(matchParticipantsTable.matchId, match.matchId))
          .run();
        tx.delete(matchTeamsTable)
          .where(eq(matchTeamsTable.matchId, match.matchId))
          .run();

        if (match.participants.length) {
          tx.insert(matchParticipantsTable)
            .values(
              match.participants.map((participant, participantIndex) => ({
                matchId: match.matchId,
                participantIndex,
                participantId: participant.participantId ?? null,
                puuid: participant.puuid ?? null,
                riotIdGameName: participant.riotIdGameName ?? null,
                riotIdTagline: participant.riotIdTagline ?? null,
                summonerName: participant.summonerName ?? null,
                teamId: participant.teamId ?? null,
                championId: participant.championId ?? null,
                championName: participant.championName ?? null,
                spell1Id: participant.spell1Id ?? null,
                spell2Id: participant.spell2Id ?? null,
                kills: participant.kills ?? null,
                deaths: participant.deaths ?? null,
                assists: participant.assists ?? null,
                doubleKills: participant.doubleKills ?? null,
                tripleKills: participant.tripleKills ?? null,
                quadraKills: participant.quadraKills ?? null,
                pentaKills: participant.pentaKills ?? null,
                totalDamageDealt: participant.totalDamageDealt ?? null,
                totalDamageTaken: participant.totalDamageTaken ?? null,
                goldEarned: participant.goldEarned ?? null,
                totalHeal: participant.totalHeal ?? null,
                totalCs: participant.totalCs ?? null,
                championLevel: participant.championLevel ?? null,
                visionScore: participant.visionScore ?? null,
                timeCcOthers: participant.timeCcOthers ?? null,
                largestKillingSpree: participant.largestKillingSpree ?? null,
                damageToTurrets: participant.damageToTurrets ?? null,
                win: participant.win ?? null,
                placement: participant.placement ?? null,
                itemsJson: JSON.stringify(participant.items),
                augmentsJson: JSON.stringify(participant.augments),
                perksJson: JSON.stringify(participant.perks),
                statsJson: JSON.stringify(participant.stats),
                rawPayload: participant.rawPayload,
              })),
            )
            .run();
        }

        if (match.teams.length) {
          tx.insert(matchTeamsTable)
            .values(
              match.teams.map((team) => ({
                matchId: match.matchId,
                teamId: team.teamId,
                win: team.win ?? null,
                bansJson: JSON.stringify([]),
                objectivesJson: JSON.stringify(team.objectives),
                rawPayload: team.rawPayload,
              })),
            )
            .run();
        }
      }
    });
  }

  existingMatchIds(matchIds: string[]) {
    if (!matchIds.length) {
      return new Set<string>();
    }

    const output = new Set<string>();
    for (const chunk of chunkValues(matchIds, SQLITE_PARAM_LIMIT)) {
      const rows = db.select({ matchId: matchesTable.matchId })
        .from(matchesTable)
        .where(inArray(matchesTable.matchId, chunk))
        .all();

      for (const row of rows) {
        output.add(row.matchId);
      }
    }

    return output;
  }

  listMatches(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const rows = db.select(matchSelection)
      .from(matchesTable)
      .orderBy(desc(matchesTable.gameCreation), desc(matchesTable.retrievedAt))
      .limit(pageSize)
      .offset(offset)
      .all() as MatchRow[];

    return this.hydrateListItems(rows);
  }

  listAllMatches() {
    const rows = db.select(matchSelection)
      .from(matchesTable)
      .orderBy(desc(matchesTable.gameCreation), desc(matchesTable.retrievedAt))
      .all() as MatchRow[];

    return this.hydrateListItems(rows);
  }

  listMatchesByIds(matchIds: string[]) {
    if (!matchIds.length) {
      return [] as MatchListItemDto[];
    }

    const rows = [] as MatchRow[];
    for (const chunk of chunkValues(matchIds, SQLITE_PARAM_LIMIT)) {
      rows.push(
        ...(db.select(matchSelection)
          .from(matchesTable)
          .where(inArray(matchesTable.matchId, chunk))
          .all() as MatchRow[]),
      );
    }

    const byId = new Map(this.hydrateListItems(rows).map((match) => [match.matchId, match]));
    return matchIds.map((matchId) => byId.get(matchId)).filter((match): match is MatchListItemDto => Boolean(match));
  }

  listRecentTrackedMatches(trackedPuuid: string, limit: number) {
    const rows = db.select(matchSelection)
      .from(matchesTable)
      .innerJoin(matchParticipantsTable, eq(matchParticipantsTable.matchId, matchesTable.matchId))
      .where(eq(matchParticipantsTable.puuid, trackedPuuid))
      .orderBy(desc(matchesTable.gameCreation), desc(matchesTable.retrievedAt))
      .limit(limit)
      .all() as MatchRow[];

    return this.hydrateListItems(rows);
  }

  getTrackedPlayer() {
    const matchesCount = count().as("matches");
    const bestSummonerName = max(matchParticipantsTable.summonerName).as("summonerName");
    const bestRiotName = max(matchParticipantsTable.riotIdGameName).as("riotIdGameName");

    const row = db.select({
      puuid: matchParticipantsTable.puuid,
      summonerName: bestSummonerName,
      riotIdGameName: bestRiotName,
      matches: matchesCount,
    })
      .from(matchParticipantsTable)
      .where(isNotNull(matchParticipantsTable.puuid))
      .groupBy(matchParticipantsTable.puuid)
      .orderBy(desc(matchesCount))
      .limit(1)
      .get();

    if (!row?.puuid) {
      return undefined;
    }

    return {
      puuid: row.puuid,
      summonerName: row.summonerName ?? row.riotIdGameName ?? "Unknown summoner",
      matches: row.matches ?? 0,
    };
  }

  countMatches() {
    const result = db.select({ total: count() })
      .from(matchesTable)
      .get();
    return result?.total ?? 0;
  }

  getMatchById(matchId: string): MatchDetailDto | undefined {
    const match = db.select()
      .from(matchesTable)
      .where(eq(matchesTable.matchId, matchId))
      .get();

    if (!match) {
      return undefined;
    }

    const base = this.hydrateListItems([match])[0];
    const teams = db.select()
      .from(matchTeamsTable)
      .where(eq(matchTeamsTable.matchId, matchId))
      .orderBy(asc(matchTeamsTable.teamId))
      .all();

    return {
      ...base,
      gameStartTimestamp: match.gameStartTimestamp ?? undefined,
      gameEndTimestamp: match.gameEndTimestamp ?? undefined,
      mapId: match.mapId ?? undefined,
      teams: teams.map(mapTeamRow),
      rawPayload: parseJson<unknown>(match.rawPayload),
    };
  }

  clearMatches() {
    db.transaction((tx) => {
      tx.delete(syncRunsTable).run();
      tx.delete(matchesTable).run();
    });
  }

  private hydrateListItems(matchRows: MatchRow[]) {
    if (!matchRows.length) {
      return [] as MatchListItemDto[];
    }

    const matchIds = matchRows.map((match) => match.matchId);
    const participantsByMatchId = this.getParticipantsByMatchIds(matchIds);

    return matchRows.map((match) => ({
      ...mapMatchRow(match),
      participants: participantsByMatchId.get(match.matchId) ?? [],
    }));
  }

  private getParticipantsByMatchIds(matchIds: string[]) {
    const map = new Map<string, MatchListItemDto["participants"]>();
    const profileIconsByMatchId = new Map<string, Map<number, number>>();

    for (const chunk of chunkValues(matchIds, SQLITE_PARAM_LIMIT)) {
      const matches = db.select({
        matchId: matchesTable.matchId,
        rawPayload: matchesTable.rawPayload,
      })
        .from(matchesTable)
        .where(inArray(matchesTable.matchId, chunk))
        .all();

      for (const match of matches) {
        profileIconsByMatchId.set(match.matchId, getProfileIconMap(match.rawPayload));
      }

      const rows = db.select()
        .from(matchParticipantsTable)
        .where(inArray(matchParticipantsTable.matchId, chunk))
        .orderBy(asc(matchParticipantsTable.matchId), asc(matchParticipantsTable.participantIndex))
        .all();

      for (const participant of rows) {
        const current = map.get(participant.matchId) ?? [];
        const profileIconId = participant.participantId
          ? profileIconsByMatchId.get(participant.matchId)?.get(participant.participantId)
          : undefined;
        current.push(mapParticipantRow(participant, profileIconId));
        map.set(participant.matchId, current);
      }
    }

    return map;
  }
}

export const matchRepository = new MatchRepository();
