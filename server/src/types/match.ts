export interface MatchParticipantEntity {
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
}

export interface MatchTeamEntity {
  teamId: number;
  win?: boolean;
  objectives: Record<string, unknown>;
  rawPayload: string;
}

export interface MatchEntity {
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
  participants: MatchParticipantEntity[];
  teams: MatchTeamEntity[];
  rawPayload: string;
}

export interface MatchListItemDto {
  matchId: string;
  queueId?: number;
  gameMode?: string;
  gameVersion?: string;
  gameModeMutators: string[];
  gameCreation?: number;
  gameDuration?: number;
  retrievedAt: number;
  summary: string;
  participants: Array<{
    participantId?: number;
    puuid?: string;
    summonerName?: string;
    riotIdGameName?: string;
    riotIdTagline?: string;
    profileIconId?: number;
    teamId?: number;
    championId?: number;
    championName?: string;
    spell1Id?: number;
    spell2Id?: number;
    kills?: number;
    deaths?: number;
    assists?: number;
    pentaKills?: number;
    totalDamageDealt?: number;
    totalDamageTaken?: number;
    goldEarned?: number;
    totalHeal?: number;
    totalCs?: number;
    championLevel?: number;
    win?: boolean;
    items: string[];
    augments: string[];
  }>;
}

export interface MatchDetailDto extends MatchListItemDto {
  gameStartTimestamp?: number;
  gameEndTimestamp?: number;
  mapId?: number;
  teams: MatchTeamEntity[];
  rawPayload: unknown;
}

export interface MatchSyncResult {
  stored: number;
  updated: number;
  skipped: number;
  matches: MatchListItemDto[];
}
