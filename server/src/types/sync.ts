import type { MatchListItemDto } from "./match.js";

export type SyncRunStatus = "running" | "success" | "error";
export type SyncStatusState = "idle" | SyncRunStatus;

export interface SyncRunDto {
  id: string;
  status: SyncRunStatus;
  startedAt: number;
  finishedAt?: number;
  stored: number;
  updated: number;
  skipped: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface SyncStatusDto {
  state: SyncStatusState;
  currentRun?: SyncRunDto;
  lastRun?: SyncRunDto;
}

export interface MatchSyncResultDto {
  stored: number;
  updated: number;
  skipped: number;
  run: SyncRunDto;
  matches: MatchListItemDto[];
}
