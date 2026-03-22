export interface StatusResponse {
  ok: boolean;
  message: string;
}

export interface LeagueConnectionResponse {
  ok: boolean;
  connected: boolean;
}

export interface LeagueGameflowResponse {
  ok: boolean;
  connected: boolean;
  phase?: string;
  isInGame: boolean;
  gameId?: number;
  queueId?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface LeagueAuthResponse {
  ok: boolean;
  credentials?: {
    port: number;
    username: string;
    password: string;
    address: string;
    authorizationHeader: string;
  };
  error?: string;
}

export interface SummonerResponse {
  ok: boolean;
  summoner?: {
    displayName: string;
    gameName?: string;
    tagLine?: string;
    profileIconId?: number;
    summonerId?: number;
    puuid?: string;
    summonerLevel?: number;
    raw: unknown;
  };
  error?: string;
}

export interface StaticDataEntry {
  id: string;
  name: string;
  description?: string;
  rarity?: string;
  icon_path: string;
  icon_url?: string;
  version: string;
  numeric_id?: number;
  key?: string;
  title?: string;
}

export interface StaticListResponse {
  ok: boolean;
  items: StaticDataEntry[];
}

export interface StaticSyncResponse {
  ok: boolean;
  result: {
    version: string;
    champions: number;
    items: number;
    augments: number;
    reused: boolean;
  };
}

export interface MatchParticipantSummary {
  participantId?: number;
  puuid?: string;
  summonerName?: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
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
}

export interface MatchListItem {
  matchId: string;
  queueId?: number;
  gameMode?: string;
  gameVersion?: string;
  gameModeMutators: string[];
  gameCreation?: number;
  gameDuration?: number;
  retrievedAt: number;
  summary: string;
  participants: MatchParticipantSummary[];
}

export interface MatchTeam {
  teamId: number;
  win?: boolean;
  objectives: Record<string, unknown>;
  rawPayload: string;
}

export interface MatchDetail extends MatchListItem {
  gameStartTimestamp?: number;
  gameEndTimestamp?: number;
  mapId?: number;
  teams: MatchTeam[];
  rawPayload: unknown;
}

export interface MatchListResponse {
  ok: boolean;
  page: number;
  pageSize: number;
  total: number;
  items: MatchListItem[];
}

export interface MatchDetailResponse {
  ok: boolean;
  match?: MatchDetail;
  error?: string;
}

export interface MatchSyncResponse {
  ok: boolean;
  result: {
    stored: number;
    updated: number;
    skipped: number;
    matches: MatchListItem[];
  };
}

export interface PowerShellResponse {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

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

export interface TrendPoint {
  key: string;
  label: string;
  matches: number;
  wins: number;
  winRate: number;
}

export interface ChampionStats {
  championId?: number;
  championName?: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKda: number;
  averageDamage: number;
  averageGold: number;
}

export interface AugmentStats {
  augmentId: string;
  matches: number;
  wins: number;
  winRate: number;
  rarity?: string;
  label?: string;
}

export interface MatchSpotlight {
  match: MatchListItem;
  participant: MatchParticipantSummary;
}

export interface DashboardAnalytics {
  overview: DashboardOverview;
  recentSession: SessionSnapshot;
  streak: StreakSnapshot;
  activity: ActivityDay[];
  trend: TrendPoint[];
  topChampions: ChampionStats[];
  topAugments: AugmentStats[];
  recentMatches: MatchSpotlight[];
}

export interface ProfileAnalytics {
  overview: DashboardOverview;
  currentStreak: StreakSnapshot;
  bestWinStreak: number;
  bestLossStreak: number;
  records: {
    highestKills: number;
    highestAssists: number;
    highestDamage: number;
    highestGold: number;
    pentakills: number;
  };
}

export interface TeammateStats {
  puuid: string;
  summonerName: string;
  matches: number;
  winsTogether: number;
  lossesTogether: number;
  winRateTogether: number;
  lastSeenAt?: number;
  rating?: number;
  note?: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updatedAt: number;
}

export interface PlayerRating {
  targetPuuid: string;
  summonerName?: string;
  rating?: number;
  note?: string;
  updatedAt: number;
}

export interface DashboardResponse {
  ok: boolean;
  dashboard: DashboardAnalytics;
}

export interface ProfileResponse {
  ok: boolean;
  profile: ProfileAnalytics;
}

export interface ChampionStatsResponse {
  ok: boolean;
  items: ChampionStats[];
}

export interface AugmentStatsResponse {
  ok: boolean;
  items: AugmentStats[];
}

export interface TeammateStatsResponse {
  ok: boolean;
  items: TeammateStats[];
}

export interface SettingsResponse {
  ok: boolean;
  items: AppSetting[];
}

export interface SettingUpdateResponse {
  ok: boolean;
  item: AppSetting;
}

export interface RatingsResponse {
  ok: boolean;
  items: PlayerRating[];
}

export interface RatingUpdateResponse {
  ok: boolean;
  item: PlayerRating;
}
