import crypto from "node:crypto";
import { matchRepository } from "../repositories/matchRepository.js";
import { staticDataRepository } from "../repositories/staticDataRepository.js";
import type { MatchEntity, MatchSyncResult } from "../types/match.js";
import { leagueService } from "./leagueService.js";

function readNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "Win") {
    return true;
  }
  if (value === "Fail") {
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

function extractHistoryGames(history: Record<string, unknown>) {
  const games = history.games;

  if (games && typeof games === "object" && Array.isArray((games as { games?: unknown[] }).games)) {
    return (games as { games: unknown[] }).games;
  }

  if (Array.isArray(games)) {
    return games;
  }

  return [] as unknown[];
}

function findCurrentParticipant(game: Record<string, unknown>, puuid: string) {
  const participants = Array.isArray(game.participants) ? game.participants : [];
  const directParticipant = participants.find((participant) => {
    const entry = participant as Record<string, unknown>;
    return entry.puuid === puuid;
  });

  if (directParticipant && typeof directParticipant === "object") {
    return directParticipant as Record<string, unknown>;
  }

  const identities = Array.isArray(game.participantIdentities) ? game.participantIdentities : [];
  const identity = identities.find((identityEntry) => {
    const identityRecord = identityEntry as Record<string, unknown>;
    const player = identityRecord.player as Record<string, unknown> | undefined;
    return player?.puuid === puuid;
  }) as Record<string, unknown> | undefined;

  const participantId = readNumber(identity?.participantId);
  if (!participantId) {
    return null;
  }

  const resolved = participants.find((participant) => {
    const entry = participant as Record<string, unknown>;
    return readNumber(entry.participantId) === participantId;
  });

  return resolved && typeof resolved === "object" ? (resolved as Record<string, unknown>) : null;
}

export class MatchService {
  async syncCurrentMatches(): Promise<MatchSyncResult> {
    const currentSummoner = await leagueService.getCurrentSummoner();
    if (!currentSummoner.puuid) {
      throw new Error("No current summoner PUUID available.");
    }

    const history = await leagueService.getMatchHistory();
    const rawGames = extractHistoryGames(history);
    const fullGames: Record<string, unknown>[] = [];

    for (const rawGame of rawGames) {
      if (!rawGame || typeof rawGame !== "object") {
        continue;
      }

      const game = rawGame as Record<string, unknown>;
      const queueId = readNumber(game.queueId);
      const gameId = readNumber(game.gameId);

      if (queueId !== 2400) {
        continue;
      }

      const fullGame = gameId ? await leagueService.safeGetGameDetails(gameId) : null;
      const resolvedGame = fullGame ?? game;

      if (!findCurrentParticipant(resolvedGame, currentSummoner.puuid)) {
        continue;
      }

      fullGames.push(resolvedGame);
    }

    const matches: MatchEntity[] = fullGames.map((game) => this.toMatchEntity(game));

    const existingIds = new Set(matchRepository.listMatches(1, 1000).map((match) => match.matchId));
    matchRepository.upsertMatches(matches);

    let stored = 0;
    let updated = 0;
    for (const match of matches) {
      if (existingIds.has(match.matchId)) {
        updated += 1;
      } else {
        stored += 1;
      }
    }

    return {
      stored,
      updated,
      skipped: 0,
      matches: matchRepository.listMatches(1, Math.min(matches.length || 1, 20)),
    };
  }

  listMatches(page: number, pageSize: number) {
    return {
      page,
      pageSize,
      total: matchRepository.countMatches(),
      items: matchRepository.listMatches(page, pageSize),
    };
  }

  getMatch(matchId: string) {
    return matchRepository.getMatchById(matchId);
  }

  clearMatches() {
    matchRepository.clearMatches();
  }

  private toMatchEntity(game: Record<string, unknown>): MatchEntity {
    const metadata = (game.gameMetadata ?? {}) as Record<string, unknown>;
    const identityMap = getIdentityMap(game);
    const participants = Array.isArray(game.participants) ? game.participants : [];
    const teams = Array.isArray(game.teams) ? game.teams : [];
    const queueId = readNumber(game.queueId);
    const gameMode = typeof game.gameMode === "string" ? game.gameMode : queueId === 450 ? "ARAM" : undefined;
    const matchId = String(game.gameId ?? metadata.matchId ?? crypto.randomUUID());
    const gameModeMutators = Array.isArray(game.gameModeMutators)
      ? game.gameModeMutators.filter((entry): entry is string => typeof entry === "string")
      : [];

    const normalizedParticipants = participants.map((participant) => {
      const entry = participant as Record<string, unknown>;
      const stats = (entry.stats ?? {}) as Record<string, unknown>;
      const participantId = readNumber(entry.participantId ?? stats.participantId);
      const identity = participantId ? identityMap.get(participantId) : undefined;
      const championId = readNumber(entry.championId);
      const champion = championId ? staticDataRepository.getChampionByNumericId(championId) : undefined;

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
        championName: champion?.name ? String(champion.name) : entry.championName ? String(entry.championName) : undefined,
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
        perks: Array.isArray(entry.perks) ? entry.perks.map((value) => String(value)) : [],
        stats: { ...entry, stats },
        rawPayload: JSON.stringify(entry),
      };
    });

    const normalizedTeams = teams.map((team) => {
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
    });

    const summary = `${gameMode ?? "League"} #${matchId} · ${normalizedParticipants.length} participants${gameModeMutators.length ? ` · ${gameModeMutators.join(", ")}` : ""}`;

    return {
      matchId,
      queueId,
      gameMode,
      gameVersion: typeof game.gameVersion === "string" ? game.gameVersion : undefined,
      gameModeMutators,
      mapId: readNumber(game.mapId),
      gameCreation: readNumber(game.gameCreation),
      gameStartTimestamp: readNumber(game.gameStartTimestamp),
      gameEndTimestamp: readNumber(game.gameEndTimestamp),
      gameDuration: readNumber(game.gameDuration),
      retrievedAt: Date.now(),
      summary,
      participants: normalizedParticipants,
      teams: normalizedTeams,
      rawPayload: JSON.stringify(game),
    };
  }
}

export const matchService = new MatchService();
