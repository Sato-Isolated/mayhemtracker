import type { MatchListItemDto } from "./match.js";

export interface DashboardOverviewDto {
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

export interface SessionSnapshotDto {
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKda: number;
  windowStart?: number;
  lastPlayedAt?: number;
}

export interface StreakSnapshotDto {
  type: "win" | "loss" | "neutral";
  value: number;
}

export interface ActivityDayDto {
  key: string;
  label: string;
  matches: number;
  intensity: number;
}

export interface TrendPointDto {
  key: string;
  label: string;
  matches: number;
  wins: number;
  winRate: number;
}

export interface ChampionStatsDto {
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

export interface AugmentStatsDto {
  augmentId: string;
  matches: number;
  wins: number;
  winRate: number;
  rarity?: string;
  label?: string;
}

export interface MatchSpotlightDto {
  match: MatchListItemDto;
  participant: MatchListItemDto["participants"][number];
}

export interface DashboardAnalyticsDto {
  overview: DashboardOverviewDto;
  recentSession: SessionSnapshotDto;
  streak: StreakSnapshotDto;
  activity: ActivityDayDto[];
  trend: TrendPointDto[];
  topChampions: ChampionStatsDto[];
  topAugments: AugmentStatsDto[];
  recentMatches: MatchSpotlightDto[];
}

export interface ProfileAnalyticsDto {
  overview: DashboardOverviewDto;
  currentStreak: StreakSnapshotDto;
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

export interface TeammateStatsDto {
  puuid: string;
  summonerName: string;
  matches: number;
  winsTogether: number;
  lossesTogether: number;
  winRateTogether: number;
  lastSeenAt?: number;
  recentMatchesTogether: number;
  averageKdaTogether: number;
  rating?: number;
  note?: string;
}

export interface PlayerRatingDto {
  targetPuuid: string;
  summonerName?: string;
  rating?: number;
  note?: string;
  updatedAt: number;
}

export interface AppSettingDto {
  key: string;
  value: string;
  updatedAt: number;
}